package io.tohuwabohu.crud

import io.quarkus.elytron.security.common.BcryptUtil
import io.quarkus.security.ForbiddenException
import io.smallrye.mutiny.Uni
import io.smallrye.mutiny.unchecked.Unchecked
import io.tohuwabohu.crud.relation.LibreUserRelatedRepository
import io.tohuwabohu.crud.relation.LibreUserWeakEntity
import io.tohuwabohu.security.AuthenticationResponse
import jakarta.enterprise.context.ApplicationScoped
import jakarta.persistence.*
import org.eclipse.microprofile.config.inject.ConfigProperty
import org.hibernate.proxy.HibernateProxy
import java.time.LocalDateTime
import java.util.*

@Entity
@NamedQueries(
    NamedQuery(name = "AuthSession.findRefreshToken",
        query = "from AuthSession where userId = ?1 and refreshToken = ?2"
    ),
    NamedQuery(name = "AuthSession.listRefreshTokens",
        query = "from AuthSession where userId = ?1 order by added desc"
    )
)
@Cacheable
data class AuthSession (
    @Column(nullable = false)
    var refreshToken: String? = null,

    var expiresAt: LocalDateTime? = null
): LibreUserWeakEntity() {
    final override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null) return false
        val oEffectiveClass =
            if (other is HibernateProxy) other.hibernateLazyInitializer.persistentClass else other.javaClass
        val thisEffectiveClass =
            if (this is HibernateProxy) this.hibernateLazyInitializer.persistentClass else this.javaClass
        if (thisEffectiveClass != oEffectiveClass) return false
        other as AuthSession

        return userId != null && userId == other.userId
    }

    final override fun hashCode(): Int =
        if (this is HibernateProxy) this.hibernateLazyInitializer.persistentClass.hashCode() else javaClass.hashCode()

    @Override
    override fun toString(): String {
        return this::class.simpleName + "(userId = $userId , refreshToken = $refreshToken , expiresAt = $expiresAt , added = $added , sequence = $sequence )"
    }

    @PrePersist
    fun preInsert() {
        refreshToken = BcryptUtil.bcryptHash(refreshToken)
    }
}

@ApplicationScoped
class AuthRepository : LibreUserRelatedRepository<AuthSession>() {
    @ConfigProperty(name = "libreuser.tokens.max", defaultValue = "1")
    private lateinit var maxTokens: String

    fun findSession(userId: UUID, token: String) = find("#AuthSession.findRefreshToken", userId, BcryptUtil.bcryptHash(token))
        .firstResult().onItem().ifNull().failWith(EntityNotFoundException())
        .onItem().ifNotNull().invoke (Unchecked.consumer { authSession ->
            if (authSession!!.expiresAt!!.isBefore(LocalDateTime.now())) throw ForbiddenException("Refresh token expired.")
        })

    fun addSession(authSession: AuthSession, accessToken: String): Uni<AuthenticationResponse> = list("#AuthSession.listRefreshTokens", authSession.userId!!)
        .onItem().ifNotNull().transform { list ->
            if (list.size >= maxTokens.toLong()) list[0]
            else null
        }.chain { oldest ->
            oldest?.let { delete(oldest) }?.chain { _ -> validateAndPersist(authSession) } ?: validateAndPersist(authSession)
        }.onItem().transform { persistedAuthSession -> AuthenticationResponse(accessToken, persistedAuthSession.refreshToken!! ) }

    fun invalidateSession(userId: UUID, refreshToken: String): Uni<AuthSession?> = findSession(userId, refreshToken)
        .onItem().ifNotNull().call { authSession -> delete(authSession!!) }

}