package com.learning.tribetalk.entity;



import jakarta.persistence.*;

@Entity
@Table(name = "authorities")
public class Authority {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String authority;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Default constructor
    public Authority() {}

    // All-args constructor
    public Authority(Long id, String authority, User user) {
        this.id = id;
        this.authority = authority;
        this.user = user;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAuthority() { return authority; }
    public void setAuthority(String authority) { this.authority = authority; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}

