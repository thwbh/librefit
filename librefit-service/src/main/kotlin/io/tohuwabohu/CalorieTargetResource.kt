package io.tohuwabohu

import io.quarkus.logging.Log
import io.quarkus.security.identity.SecurityIdentity
import io.smallrye.mutiny.Uni
import io.tohuwabohu.crud.CalorieTarget
import io.tohuwabohu.crud.CalorieTargetRepository
import io.tohuwabohu.crud.error.ErrorResponse
import io.tohuwabohu.crud.error.createErrorResponse
import jakarta.annotation.security.RolesAllowed
import jakarta.persistence.EntityNotFoundException
import jakarta.validation.Valid
import jakarta.ws.rs.*
import jakarta.ws.rs.core.Context
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import jakarta.ws.rs.core.SecurityContext
import org.eclipse.microprofile.openapi.annotations.Operation
import org.eclipse.microprofile.openapi.annotations.media.Content
import org.eclipse.microprofile.openapi.annotations.media.Schema
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses
import java.time.LocalDate
import java.util.*

@Path("/api/target/calories")
class CalorieTargetResource(private val calorieTargetRepository: CalorieTargetRepository) {
    @POST
    @Path("/create")
    @RolesAllowed("User", "Admin")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @APIResponses(
        APIResponse(responseCode = "201", description = "Created", content = [
            Content(
                mediaType = "application/json",
                schema = Schema(implementation = CalorieTarget::class)
            )
        ]),
        APIResponse(responseCode = "400", description = "Bad Request", content = [
            Content(
                mediaType = "application/json",
                schema = Schema(implementation = ErrorResponse::class)
            )
        ]),
        APIResponse(responseCode = "401", description = "Unauthorized"),
        APIResponse(responseCode = "500", description = "Internal Server Error")
    )
    @Operation(
        operationId = "createCalorieTarget"
    )
    fun create(@Context securityIdentity: SecurityIdentity, @Valid calorieTarget: CalorieTarget): Uni<Response> {
        Log.info("Creating a new calorieTarget=$calorieTarget")

        calorieTarget.userId = UUID.fromString(securityIdentity.principal.name)

        return calorieTargetRepository.validateAndPersist(calorieTarget)
            .onItem().transform { entry -> Response.ok(entry).status(Response.Status.CREATED).build() }
            .onFailure().invoke { e -> Log.error(e) }
            .onFailure().recoverWithItem{throwable -> createErrorResponse(throwable) }
    }

    @PUT
    @Path("/update")
    @RolesAllowed("User", "Admin")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @APIResponses(
        APIResponse(responseCode = "200", description = "OK"),
        APIResponse(responseCode = "404", description = "Not Found"),
        APIResponse(responseCode = "400", description = "Bad Request", content = [ Content(
            mediaType = "application/json",
            schema = Schema(implementation = ErrorResponse::class)
        )]),
        APIResponse(responseCode = "401", description = "Unauthorized"),
        APIResponse(responseCode = "500", description = "Internal Server Error")
    )
    @Operation(
        operationId = "updateCalorieTarget"
    )
    fun update(@Context securityContext: SecurityContext, @Valid calorieTarget: CalorieTarget): Uni<Response> {
        Log.info("updating calorieTarget $calorieTarget")


        return calorieTargetRepository.updateEntry(calorieTarget, CalorieTarget::class.java)
            .onItem().transform { updated -> Response.ok(updated).build() }
            .onFailure().invoke{ e -> Log.error(e)}
            .onFailure().recoverWithItem { throwable -> createErrorResponse(throwable) }
    }

    @GET
    @Path("/read/{date}/{sequence:\\d+}")
    @RolesAllowed("User", "Admin")
    @Produces(MediaType.APPLICATION_JSON)
    @APIResponses(
        APIResponse(responseCode = "200", description = "OK", content = [
            Content(
                mediaType = "application/json",
                schema = Schema(implementation = CalorieTarget::class)
            )
        ]),
        APIResponse(responseCode = "404", description = "Not Found"),
        APIResponse(responseCode = "400", description = "Bad Request", content = [ Content(
            mediaType = "application/json",
            schema = Schema(implementation = ErrorResponse::class)
        )]),
        APIResponse(responseCode = "401", description = "Unauthorized"),
        APIResponse(responseCode = "500", description = "Internal Server Error")
    )
    @Operation(
        operationId = "readCalorieTarget"
    )
    fun read(@Context securityIdentity: SecurityIdentity, date: LocalDate, sequence: Long): Uni<Response> {
        return calorieTargetRepository.readEntry(UUID.fromString(securityIdentity.principal.name), date, sequence)
            .onItem().transform { entry -> Response.ok(entry).build() }
            .onFailure().invoke { e -> Log.error(e) }
            .onFailure().recoverWithItem { throwable -> createErrorResponse(throwable) }
    }

    @DELETE
    @Path("/delete/{date}/{sequence:\\d+}")
    @RolesAllowed("User", "Admin")
    @Consumes(MediaType.APPLICATION_JSON)
    @APIResponses(
        APIResponse(responseCode = "200", description = "OK"),
        APIResponse(responseCode = "404", description = "Not Found"),
        APIResponse(responseCode = "400", description = "Bad Request", content = [ Content(
            mediaType = "application/json",
            schema = Schema(implementation = ErrorResponse::class)
        )]),
        APIResponse(responseCode = "401", description = "Unauthorized"),
        APIResponse(responseCode = "500", description = "Internal Server Error")
    )
    @Operation(
        operationId = "deleteCalorieTarget"
    )
    fun delete(@Context securityIdentity: SecurityIdentity, date: LocalDate, sequence: Long): Uni<Response> {
        Log.info("deleting calorieTarget with added=$date Ssequence=$sequence")

        return calorieTargetRepository.deleteEntry(UUID.fromString(securityIdentity.principal.name), date, sequence)
            .onItem().transform { deleted -> if (deleted == true) Response.ok().build() else Response.serverError().build() }
            .onFailure().invoke { e -> Log.error(e) }
            .onFailure().recoverWithItem {throwable -> createErrorResponse(throwable) }
    }

    @GET
    @Path("/last")
    @RolesAllowed("User", "Admin")
    @APIResponses(
        APIResponse(responseCode = "200", description = "OK", content = [
            Content(
                mediaType = "application/json",
                schema = Schema(implementation = CalorieTarget::class)
            )
        ]),
        APIResponse(responseCode = "400", description = "Bad Request", content = [ Content(
            mediaType = "application/json",
            schema = Schema(implementation = ErrorResponse::class)
        )]),
        APIResponse(responseCode = "401", description = "Unauthorized"),
        APIResponse(responseCode = "500", description = "Internal Server Error")
    )
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
        operationId = "findLastCalorieTarget"
    )
    fun latest(@Context securityIdentity: SecurityIdentity): Uni<Response> = calorieTargetRepository
        .findLatestCalorieTarget(UUID.fromString(securityIdentity.principal.name))
        .onItem().ifNotNull().transform { entry -> Response.ok(entry).build() }
        .onItem().ifNull().failWith(EntityNotFoundException())
        .onFailure().invoke { e -> Log.error(e) }
        .onFailure().recoverWithItem{ throwable -> createErrorResponse(throwable) }
}