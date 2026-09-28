package com.ceylon.intellibiz.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.ceylon.intellibiz.dto.ApiError;
import com.ceylon.intellibiz.model.Category;
import com.ceylon.intellibiz.model.Product;
import com.ceylon.intellibiz.repository.CategoryRepository;
import com.ceylon.intellibiz.repository.ProductRepository;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class CategoryControllerTest {

    static CategoryRepository fakeCategoryRepository(List<Category> store) {
        return (CategoryRepository) Proxy.newProxyInstance(
            CategoryControllerTest.class.getClassLoader(),
            new Class<?>[] {CategoryRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "save" -> {
                    Category category = (Category) args[0];
                    if (category.getId() == null) {
                        category.setId(String.valueOf(store.size() + 1));
                    }
                    store.removeIf(existing -> existing.getId().equals(category.getId()));
                    store.add(category);
                    yield category;
                }
                case "findById" -> store.stream().filter(c -> c.getId().equals(args[0])).findFirst();
                case "findAllByOrderByNameAsc" -> store.stream()
                    .sorted(Comparator.comparing(Category::getName))
                    .collect(Collectors.toList());
                case "deleteById" -> {
                    store.removeIf(c -> c.getId().equals(args[0]));
                    yield null;
                }
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeCategoryRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    static ProductRepository fakeProductRepository(List<Product> store) {
        return (ProductRepository) Proxy.newProxyInstance(
            CategoryControllerTest.class.getClassLoader(),
            new Class<?>[] {ProductRepository.class},
            (proxy, method, args) -> switch (method.getName()) {
                case "findByCategory" -> store.stream().filter(p -> p.getCategory().equals(args[0])).collect(Collectors.toList());
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "FakeProductRepository";
                default -> throw new UnsupportedOperationException(method.getName());
            });
    }

    private final List<Category> categories = new ArrayList<>();
    private final List<Product> products = new ArrayList<>();
    private CategoryController controller;

    @BeforeEach
    void setUp() {
        categories.clear();
        products.clear();
        controller = new CategoryController(fakeCategoryRepository(categories), fakeProductRepository(products));
    }

    @Test
    void createsACategory() {
        ResponseEntity<?> response = controller.create(new Category(null, "Software", null));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        Category saved = (Category) response.getBody();
        assertNotNull(saved);
        assertEquals("Software", saved.getName());
    }

    @Test
    void duplicateNamesAreRejectedCaseInsensitively() {
        controller.create(new Category(null, "Software", null));

        ResponseEntity<?> response = controller.create(new Category(null, "software", null));

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("That category already exists.", ((ApiError) response.getBody()).getMessage());
        assertEquals(1, categories.size());
    }

    @Test
    void aCategoryStillUsedByAProductCannotBeDeleted() {
        Category saved = (Category) controller.create(new Category(null, "Add-on", null)).getBody();
        Product product = new Product();
        product.setCategory("Add-on");
        products.add(product);

        ResponseEntity<?> response = controller.delete(saved.getId());

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(1, categories.size());
    }

    @Test
    void anUnusedCategoryCanBeDeleted() {
        Category saved = (Category) controller.create(new Category(null, "Service", null)).getBody();

        ResponseEntity<?> response = controller.delete(saved.getId());

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertEquals(0, categories.size());
    }

    @Test
    void deletingAMissingCategoryReturns404() {
        ResponseEntity<?> response = controller.delete("missing");
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
