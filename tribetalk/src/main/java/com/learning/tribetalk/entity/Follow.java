package com.learning.tribetalk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.io.Serializable;
import java.sql.Timestamp;

@Entity
@Table(
        name = "follows",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"follower_id","following_id"})}
        )
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id",
            referencedColumnName = "id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_follow_follower"))
    @OnDelete(action= OnDeleteAction.CASCADE) // Has to be mentioned in Unidirectional relationships
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id",
            referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_follow_followimg"))
    private User following;

    @Column(name = "created_at", nullable = false, updatable = false) // change to common class
    private Timestamp createdAt = new Timestamp(System.currentTimeMillis());
}
