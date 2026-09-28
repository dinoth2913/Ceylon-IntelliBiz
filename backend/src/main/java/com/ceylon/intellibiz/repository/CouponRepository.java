package com.ceylon.intellibiz.repository;

import com.ceylon.intellibiz.model.Coupon;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends MongoRepository<Coupon, String> {
    List<Coupon> findAllByOrderByCreatedAtDesc();

    Optional<Coupon> findByCodeIgnoreCase(String code);
}
