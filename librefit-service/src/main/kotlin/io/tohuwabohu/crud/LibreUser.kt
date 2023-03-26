package io.tohuwabohu.crud

import io.quarkus.hibernate.reactive.panache.kotlin.PanacheEntity
import io.quarkus.hibernate.reactive.panache.kotlin.PanacheRepository
import io.smallrye.mutiny.Uni
import io.tohuwabohu.crud.error.ValidationError
import java.time.LocalDateTime
import javax.enterprise.context.ApplicationScoped
import javax.persistence.Cacheable
import javax.persistence.Entity

@Entity
@Cacheable
class LibreUser: PanacheEntity() {
    lateinit var password: String
    lateinit var email: String
    var name: String? = null
    var registered: LocalDateTime? = null
    var lastLogin: LocalDateTime? = null

    override fun toString(): String {
        return "LibreUser<name=$name,email=$email,registered=$registered,lastLogin=$lastLogin>"
    }
}

@ApplicationScoped
class LibreUserRepository(val validation: LibreUserValidation) : PanacheRepository<LibreUser> {

    fun findByEmail(email: String): Uni<LibreUser?> = find("email = ?1", email).firstResult()

    fun createUser(user: LibreUser): Uni<LibreUser?> {
        return findByEmail(user.email)
            .onItem().ifNotNull().failWith(ValidationError("A User with this E-Mail already exists."))
            .onItem().ifNull().continueWith(user)
                .invoke{ new -> validation.checkPassword(new!!) }
                .chain { new -> persistAndFlush(new!!) }
    }

    fun findByEmailAndPassword(email: String, password: String): Uni<LibreUser?> =
        find("email = ?1 and password = crypt(?2, password)", email, password).firstResult()
}

@ApplicationScoped
class LibreUserValidation {

    fun checkPassword(user: LibreUser) {
        if (user.password.isEmpty()) {
            throw ValidationError("The provided password is empty.")
        } else if (!user.password.contains('b')) {
            throw ValidationError("The password must contain at least one 'b' letter.")
        }
    }
}