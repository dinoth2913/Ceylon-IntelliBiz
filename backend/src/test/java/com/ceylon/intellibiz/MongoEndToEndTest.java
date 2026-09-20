package com.ceylon.intellibiz;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.ceylon.intellibiz.dto.AiBusinessContext;
import com.ceylon.intellibiz.service.BusinessContextService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCredential;
import com.mongodb.ServerAddress;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.bson.Document;
import org.bson.types.Decimal128;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Boots the whole application against a REAL MongoDB and drives it through its HTTP API with real JWTs.
 *
 * Skipped unless a test database is available, so a plain `mvn test` needs no database. To run it, start a
 * MongoDB with authentication on and export:
 *   MONGODB_TEST_PORT, MONGODB_TEST_USER, MONGODB_TEST_PASSWORD
 * By default the user needs the root role (authSource admin) and each run uses its own throwaway database.
 * To run as the real application user instead, also set MONGODB_TEST_DATABASE (e.g. intellibiz) and
 * MONGODB_TEST_AUTH_DB; the test then only cleans up the collections it created.
 */
@EnabledIfEnvironmentVariable(named = "MONGODB_TEST_PORT", matches = "\\d+")
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MongoEndToEndTest {

    private static final String DATABASE = System.getenv("MONGODB_TEST_DATABASE") != null
        ? System.getenv("MONGODB_TEST_DATABASE")
        : "it_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    private static final String AUTH_DATABASE = System.getenv("MONGODB_TEST_AUTH_DB") != null ? System.getenv("MONGODB_TEST_AUTH_DB") : "admin";
    private static final String ADMIN_EMAIL = "root@it.test";
    private static final String ADMIN_PASSWORD = "it-admin-password-1";

    @DynamicPropertySource
    static void mongoProperties(DynamicPropertyRegistry registry) {
        wipeSharedDatabase();
        registry.add("spring.data.mongodb.host", () -> "localhost");
        registry.add("spring.data.mongodb.port", () -> System.getenv("MONGODB_TEST_PORT"));
        registry.add("spring.data.mongodb.database", () -> DATABASE);
        registry.add("spring.data.mongodb.authentication-database", () -> AUTH_DATABASE);
        registry.add("spring.data.mongodb.username", () -> System.getenv("MONGODB_TEST_USER"));
        registry.add("spring.data.mongodb.password", () -> System.getenv("MONGODB_TEST_PASSWORD"));
        registry.add("app.bootstrap-admin.username", () -> "itroot");
        registry.add("app.bootstrap-admin.email", () -> ADMIN_EMAIL);
        registry.add("app.bootstrap-admin.password", () -> ADMIN_PASSWORD);
        // Nothing listens here, so the chat falls back to its built-in answers instead of calling the AI service.
        registry.add("ai.service.url", () -> "http://127.0.0.1:9");
    }

    /**
     * When pointed at a shared database, start from empty: the app only bootstraps its first admin if none exists,
     * so leftovers from an earlier run (or a real app run) would make this test's assumptions false.
     */
    private static void wipeSharedDatabase() {
        if (System.getenv("MONGODB_TEST_DATABASE") == null) {
            return; // a fresh throwaway database is already empty
        }
        MongoCredential credential = MongoCredential.createCredential(
            System.getenv("MONGODB_TEST_USER"), AUTH_DATABASE, System.getenv("MONGODB_TEST_PASSWORD").toCharArray());
        MongoClientSettings settings = MongoClientSettings.builder()
            .credential(credential)
            .applyToClusterSettings(cluster -> cluster.hosts(List.of(new ServerAddress("localhost", Integer.parseInt(System.getenv("MONGODB_TEST_PORT"))))))
            .build();
        try (MongoClient client = MongoClients.create(settings)) {
            MongoDatabase database = client.getDatabase(DATABASE);
            for (String collection : database.listCollectionNames()) {
                database.getCollection(collection).drop();
            }
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired MongoTemplate mongoTemplate;
    @Autowired BusinessContextService businessContextService;

    private final ObjectMapper json = new ObjectMapper();
    private final AtomicInteger counter = new AtomicInteger();
    private String adminBearer;

    private record Account(String id, String username, String bearer) {
    }

    @BeforeAll
    void signInAsTheBootstrapAdmin() throws Exception {
        adminBearer = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    @AfterAll
    void cleanUp() {
        // Works for a throwaway database and for a shared one alike: remove everything this run created.
        for (String collection : mongoTemplate.getCollectionNames()) {
            mongoTemplate.dropCollection(collection);
        }
    }

    // ---------------------------------------------------------------- helpers

    private JsonNode parse(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }

    private String login(String usernameOrEmail, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"usernameOrEmail\":\"" + usernameOrEmail + "\",\"password\":\"" + password + "\"}"))
            .andExpect(status().isOk())
            .andReturn();
        return "Bearer " + parse(result).get("token").asText();
    }

    private Account signUp() throws Exception {
        String username = "user" + counter.incrementAndGet() + "-" + UUID.randomUUID().toString().substring(0, 6);
        MvcResult result = mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + username + "\",\"email\":\"" + username + "@it.test\",\"password\":\"correct-horse-1\"}"))
            .andExpect(status().isOk())
            .andReturn();
        JsonNode body = parse(result);
        return new Account(body.get("userId").asText(), username, "Bearer " + body.get("token").asText());
    }

    private Account signUpAs(String role) throws Exception {
        Account account = signUp();
        mockMvc.perform(put("/api/users/" + account.id() + "/role").header("Authorization", adminBearer)
                .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"" + role + "\"}"))
            .andExpect(status().isOk());
        return account;
    }

    private JsonNode create(String path, String bearer, String body) throws Exception {
        return parse(mockMvc.perform(post(path).header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk()).andReturn());
    }

    private int createStatus(String path, String bearer, String body) throws Exception {
        return mockMvc.perform(post(path).header("Authorization", bearer).contentType(MediaType.APPLICATION_JSON).content(body))
            .andReturn().getResponse().getStatus();
    }

    private String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    // ------------------------------------------------------------------ tests

    @Test
    void theBootstrapAdminExistsAndTheUniqueIndexesAreCreated() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", adminBearer))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("itroot"))
            .andExpect(jsonPath("$.role").value("ADMIN"));

        assertUniqueIndex("users", "username");
        assertUniqueIndex("users", "email");
        assertUniqueIndex("orders", "orderNumber");
        assertUniqueIndex("invoices", "invoiceNumber");
        assertUniqueIndex("inventory_items", "sku");
    }

    private void assertUniqueIndex(String collection, String field) {
        boolean found = false;
        for (IndexInfo index : mongoTemplate.indexOps(collection).getIndexInfo()) {
            found |= index.isUnique() && index.getIndexFields().size() == 1 && index.getIndexFields().get(0).getKey().equals(field);
        }
        assertTrue(found, collection + "." + field + " should have a unique index, but the indexes are: "
            + mongoTemplate.indexOps(collection).getIndexInfo());
    }

    @Test
    void signUpIsStaffAndAnAdminPromotionTakesEffectImmediately() throws Exception {
        Account newcomer = signUp();
        mockMvc.perform(get("/api/customers").header("Authorization", newcomer.bearer())).andExpect(status().isForbidden());

        mockMvc.perform(put("/api/users/" + newcomer.id() + "/role").header("Authorization", adminBearer)
                .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"SALES\"}"))
            .andExpect(status().isOk());

        // Same token as before: the role is read from the database on every request.
        mockMvc.perform(get("/api/customers").header("Authorization", newcomer.bearer())).andExpect(status().isOk());
    }

    @Test
    void duplicateUsernamesAndEmailsAreRejected() throws Exception {
        Account first = signUp();
        String body = "{\"username\":\"" + first.username() + "\",\"email\":\"other-" + first.username() + "@it.test\",\"password\":\"correct-horse-1\"}";
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isConflict());
        String sameEmail = "{\"username\":\"x-" + first.username() + "\",\"email\":\"" + first.username() + "@it.test\",\"password\":\"correct-horse-1\"}";
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(sameEmail)).andExpect(status().isConflict());
    }

    @Test
    void theLastAdminCannotBeDemotedAndUsersNeverExposePasswordHashes() throws Exception {
        String adminId = parse(mockMvc.perform(get("/api/auth/me").header("Authorization", adminBearer)).andReturn()).get("userId").asText();

        mockMvc.perform(put("/api/users/" + adminId + "/role").header("Authorization", adminBearer)
                .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"STAFF\"}"))
            .andExpect(status().isConflict());

        MvcResult list = mockMvc.perform(get("/api/users").header("Authorization", adminBearer)).andExpect(status().isOk()).andReturn();
        assertFalse(list.getResponse().getContentAsString().contains("passwordHash"));
        assertFalse(list.getResponse().getContentAsString().contains("$2a$"), "no BCrypt hash may leave the server");
    }

    @Test
    void customersCanBeCreatedSearchedUpdatedAndDeleted() throws Exception {
        Account sales = signUpAs("SALES");
        String company = unique("Acme");

        JsonNode created = create("/api/customers", sales.bearer(),
            "{\"fullName\":\"Nimal Perera\",\"companyName\":\"" + company + " Traders\",\"email\":\"n@acme.lk\",\"phone\":\"0771234567\"}");
        String id = created.get("id").asText();
        assertEquals(24, id.length(), "ids are Mongo ObjectIds");

        mockMvc.perform(get("/api/customers/" + id).header("Authorization", sales.bearer()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.fullName").value("Nimal Perera"));
        mockMvc.perform(get("/api/customers").param("search", company.toLowerCase()).header("Authorization", sales.bearer()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(id));

        mockMvc.perform(put("/api/customers/" + id).header("Authorization", sales.bearer()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Nimal P.\",\"companyName\":\"" + company + " Traders\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.fullName").value("Nimal P."));

        mockMvc.perform(delete("/api/customers/" + id).header("Authorization", sales.bearer())).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/customers/" + id).header("Authorization", sales.bearer())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/customers/not-an-object-id").header("Authorization", sales.bearer())).andExpect(status().isNotFound());
    }

    @Test
    void ordersCheckTheirCustomerAndKeepMoneyExact() throws Exception {
        Account sales = signUpAs("SALES");
        String customerId = create("/api/customers", sales.bearer(), "{\"fullName\":\"Kamal\"}").get("id").asText();
        String orderNumber = unique("ORD");

        JsonNode order = create("/api/orders", sales.bearer(),
            "{\"orderNumber\":\"" + orderNumber + "\",\"customerId\":\"" + customerId + "\",\"totalAmount\":1234.56,\"status\":\"Processing\"}");
        assertEquals(0, new BigDecimal("1234.56").compareTo(order.get("totalAmount").decimalValue()));

        Document raw = mongoTemplate.getCollection("orders").find(new Document("orderNumber", orderNumber)).first();
        assertNotNull(raw);
        assertTrue(raw.get("totalAmount") instanceof Decimal128, "money must be stored as Decimal128, not text or a float");
        assertEquals(new BigDecimal("1234.56"), ((Decimal128) raw.get("totalAmount")).bigDecimalValue());

        assertEquals(400, createStatus("/api/orders", sales.bearer(), "{\"orderNumber\":\"" + unique("ORD") + "\",\"customerId\":\"64b7f0000000000000000000\",\"totalAmount\":10}"),
            "an order for a customer that does not exist");
        assertEquals(400, createStatus("/api/orders", sales.bearer(), "{\"orderNumber\":\"" + unique("ORD") + "\"}"), "missing amount");
        assertEquals(400, createStatus("/api/orders", sales.bearer(), "{\"orderNumber\":\"" + unique("ORD") + "\",\"totalAmount\":-5}"), "negative amount");
        assertEquals(409, createStatus("/api/orders", sales.bearer(), "{\"orderNumber\":\"" + orderNumber + "\",\"totalAmount\":10}"), "duplicate order number");
        assertEquals(200, createStatus("/api/orders", sales.bearer(), "{\"orderNumber\":\"" + unique("ORD") + "\",\"totalAmount\":10}"), "an order with no customer is allowed");
    }

    @Test
    void aCustomerWithOrdersOrInvoicesCannotBeDeleted() throws Exception {
        Account admin = signUpAs("ADMIN");
        String withOrder = create("/api/customers", admin.bearer(), "{\"fullName\":\"Has an order\"}").get("id").asText();
        String orderId = create("/api/orders", admin.bearer(), "{\"orderNumber\":\"" + unique("ORD") + "\",\"customerId\":\"" + withOrder + "\",\"totalAmount\":5}").get("id").asText();

        mockMvc.perform(delete("/api/customers/" + withOrder).header("Authorization", admin.bearer())).andExpect(status().isConflict());
        mockMvc.perform(delete("/api/orders/" + orderId).header("Authorization", admin.bearer())).andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/customers/" + withOrder).header("Authorization", admin.bearer())).andExpect(status().isNoContent());

        String withInvoice = create("/api/customers", admin.bearer(), "{\"fullName\":\"Has an invoice\"}").get("id").asText();
        create("/api/invoices", admin.bearer(), "{\"invoiceNumber\":\"" + unique("INV") + "\",\"customerId\":\"" + withInvoice + "\",\"totalAmount\":5}");
        mockMvc.perform(delete("/api/customers/" + withInvoice).header("Authorization", admin.bearer())).andExpect(status().isConflict());
    }

    @Test
    void invoicesFilterByStatusAndOnlyFinanceAndAdminsCanWriteThem() throws Exception {
        Account finance = signUpAs("FINANCE");
        Account sales = signUpAs("SALES");
        String paid = unique("INV");
        String overdue = unique("INV");
        create("/api/invoices", finance.bearer(), "{\"invoiceNumber\":\"" + paid + "\",\"totalAmount\":100.50,\"status\":\"Paid\"}");
        create("/api/invoices", finance.bearer(), "{\"invoiceNumber\":\"" + overdue + "\",\"totalAmount\":75,\"status\":\"Overdue\"}");

        MvcResult onlyPaid = mockMvc.perform(get("/api/invoices").param("status", "Paid").header("Authorization", sales.bearer()))
            .andExpect(status().isOk()).andReturn();
        String body = onlyPaid.getResponse().getContentAsString();
        assertTrue(body.contains(paid) && !body.contains(overdue), "the status filter should return only Paid invoices");

        assertEquals(403, createStatus("/api/invoices", sales.bearer(), "{\"invoiceNumber\":\"" + unique("INV") + "\",\"totalAmount\":1}"));
        assertEquals(409, createStatus("/api/invoices", finance.bearer(), "{\"invoiceNumber\":\"" + paid + "\",\"totalAmount\":1}"), "duplicate invoice number");
    }

    @Test
    void inventoryRejectsDuplicateSkusAndFeedsTheBusinessSnapshot() throws Exception {
        Account sales = signUpAs("SALES");
        String sku = unique("SKU");
        create("/api/inventory", sales.bearer(), "{\"sku\":\"" + sku + "\",\"name\":\"Zzz Test Pallet\",\"price\":12500.75,\"stockQuantity\":3,\"reorderLevel\":20}");
        assertEquals(409, createStatus("/api/inventory", sales.bearer(), "{\"sku\":\"" + sku + "\",\"name\":\"Duplicate\",\"price\":1}"));
        assertEquals(400, createStatus("/api/inventory", sales.bearer(), "{\"sku\":\"" + unique("SKU") + "\",\"name\":\"No price\"}"));

        AiBusinessContext snapshot = businessContextService.build();
        assertTrue(snapshot.inventory().lowStock().stream().anyMatch(item -> item.name().equals("Zzz Test Pallet") && item.stock() == 3 && item.reorderLevel() == 20));
        assertTrue(snapshot.inventory().skus() >= 1);
        assertTrue(snapshot.customers() >= 0);
    }

    @Test
    void theAssistantFallsBackAndTheConversationIsStored() throws Exception {
        Account sales = signUpAs("SALES");
        String session = unique("session");

        mockMvc.perform(post("/api/chat").header("Authorization", sales.bearer()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"sessionId\":\"" + session + "\",\"content\":\"tell me about your CRM\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.intent").value("fallback"));

        mockMvc.perform(get("/api/chat/" + session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].role").value("user"))
            .andExpect(jsonPath("$[1].role").value("assistant"));
    }

    @Test
    void demoRequestsAreStoredAndOnlyReadableBySalesAndAdmins() throws Exception {
        String name = unique("Visitor");
        mockMvc.perform(post("/api/contact-requests").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"email\":\"v@it.test\",\"company\":\"Visitor Co\",\"message\":\"hello\"}"))
            .andExpect(status().isCreated());
        mockMvc.perform(post("/api/contact-requests").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Bot\",\"email\":\"b@it.test\",\"company\":\"Spam\",\"website\":\"http://spam.example\"}"))
            .andExpect(status().isCreated());

        Account sales = signUpAs("SALES");
        Account finance = signUpAs("FINANCE");
        String all = mockMvc.perform(get("/api/contact-requests").header("Authorization", sales.bearer()))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertTrue(all.contains(name));
        assertFalse(all.contains("Spam"), "honeypot submissions must not be stored");
        mockMvc.perform(get("/api/contact-requests").header("Authorization", finance.bearer())).andExpect(status().isForbidden());
    }

    @Test
    void theMarketplaceStillWorksEndToEnd() throws Exception {
        Account sales = signUpAs("SALES");
        Account staff = signUp();

        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Nope\",\"price\":1}"))
            .andExpect(status().isUnauthorized());
        String title = unique("Cinnamon");
        String productId = create("/api/products", sales.bearer(), "{\"title\":\"" + title + "\",\"price\":2450,\"category\":\"Spices\"}").get("id").asText();

        mockMvc.perform(get("/api/products/" + productId)).andExpect(status().isOk()).andExpect(jsonPath("$.title").value(title));
        mockMvc.perform(get("/api/products/search").param("keyword", title.toLowerCase())).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));

        assertEquals(200, createStatus("/api/reviews", staff.bearer(), "{\"productId\":\"" + productId + "\",\"userName\":\"Staff\",\"rating\":4,\"comment\":\"good\"}"));
        assertEquals(200, createStatus("/api/reviews", sales.bearer(), "{\"productId\":\"" + productId + "\",\"userName\":\"Sales\",\"rating\":5,\"comment\":\"great\"}"));
        mockMvc.perform(get("/api/products/" + productId))
            .andExpect(jsonPath("$.rating").value(4.5))
            .andExpect(jsonPath("$.reviewCount").value(2));
    }

    @Test
    void theDatabaseCheckIsAdminOnlyAndNeverLeaksCredentials() throws Exception {
        Account sales = signUpAs("SALES");
        mockMvc.perform(get("/api/db-test").header("Authorization", sales.bearer())).andExpect(status().isForbidden());

        String response = mockMvc.perform(get("/api/db-test").header("Authorization", adminBearer))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertEquals("MongoDB connection successful: database '" + DATABASE + "'", response);
        assertFalse(response.contains(System.getenv("MONGODB_TEST_PASSWORD")));
    }
}
