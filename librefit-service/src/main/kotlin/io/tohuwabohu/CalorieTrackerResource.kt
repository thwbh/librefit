package io.tohuwabohu

import io.tohuwabohu.crud.CalorieTrackerRepository
import io.tohuwabohu.crud.CalorieTrackerEntry
import java.time.LocalDateTime
import javax.inject.Inject
import javax.persistence.EntityExistsException
import javax.ws.rs.*
import javax.ws.rs.core.MediaType
import javax.ws.rs.core.Response

@Path("/tracker/calories")
class CalorieTrackerResource {

    @Inject
    lateinit var calorieTrackerRepository: CalorieTrackerRepository

    @POST
    @Path("/create")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    fun create(calorieTracker: CalorieTrackerEntry): Response {
        calorieTracker.added = LocalDateTime.now()

        var response = Response.ok()

        try {
            calorieTrackerRepository.create(calorieTracker)
        } catch (ex: EntityExistsException) {
            response = Response.status(Response.Status.BAD_REQUEST)

            ex.printStackTrace()
        } catch (ex: Exception) {
            response = Response.status(Response.Status.INTERNAL_SERVER_ERROR)

            ex.printStackTrace()
        }

        return response.build()
    }

    @PUT
    @Path("/update")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.APPLICATION_JSON)
    fun update(calorieTracker: CalorieTrackerEntry): Response {
        var response = Response.ok()

        try {
            val trackingEntry = calorieTrackerRepository.findById(calorieTracker.id!!)

            if (trackingEntry != null) {
                trackingEntry.amount = calorieTracker.amount
                trackingEntry.description = calorieTracker.description

                if (calorieTrackerRepository.updateTrackingEntry(trackingEntry) < 1) {
                    response = Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                }
            } else {
                response = Response.status(Response.Status.NOT_FOUND)
            }
        } catch (ex: Exception) {
            response = Response.status(Response.Status.INTERNAL_SERVER_ERROR)

            ex.printStackTrace()
        }

        return response.build()
    }

    @GET
    @Path("/read/{id:\\d+}")
    @Produces(MediaType.APPLICATION_JSON)
    fun read(id: Long) = calorieTrackerRepository.findById(id)

    @DELETE
    @Path("/delete/{id:\\d+}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.TEXT_PLAIN)
    fun delete(id: Long): Response {
        return if (calorieTrackerRepository.deleteById(id)) {
            Response.ok().build()
        } else {
            Response.status(Response.Status.NOT_FOUND).build()
        }
    }

    @GET
    @Path("/list/{userId:\\d+}")
    @Produces(MediaType.APPLICATION_JSON)
    fun list(userId: Long): List<CalorieTrackerEntry> {
        return calorieTrackerRepository.listForUser(userId)
    }
}
