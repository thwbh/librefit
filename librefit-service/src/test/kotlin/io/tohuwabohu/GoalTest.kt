package io.tohuwabohu

import io.quarkus.test.junit.QuarkusTest
import io.restassured.RestAssured
import io.restassured.http.ContentType
import io.tohuwabohu.crud.Goal
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.time.LocalDateTime

@QuarkusTest
class GoalTest {
    @Test
    fun `should create an entry`() {
        RestAssured.given()
            .header("Content-Type", ContentType.JSON)
            .body(goal(id = 1, userId = 1))
            .post("/goals/create")
            .then()
            .assertThat()
            .statusCode(201)
    }

    @Test
    fun `should create two entries`() {
        val created1 = RestAssured.given()
            .header("Content-Type", ContentType.JSON)
            .body(goal(id = 4, userId = 1))
            .post("/goals/create")
            .then()

        created1.assertThat().statusCode(201)

        val createdEntry1 = created1.extract().body().`as`(Goal::class.java)

        val created2 = RestAssured.given()
            .header("Content-Type", ContentType.JSON)
            .body(goal(5, 1))
            .post("/goals/create")
            .then()

        created2.assertThat().statusCode(201)

        val createdEntry2 = created2.extract().body().`as`(Goal::class.java)

        assert(createdEntry1.id != createdEntry2.id)
    }

    @Test
    fun `should fail on creation`() {
        var faultyEntry = goal(id = 1, userId = 1)

        faultyEntry.startAmount = -100f

        RestAssured.given()
            .header("Content-Type", ContentType.JSON)
            .body(faultyEntry)
            .post("/goals/create")
            .then()
            .assertThat()
            .statusCode(400)

        faultyEntry = goal(id = 1, userId = 1)
        faultyEntry.endAmount = -200f

        RestAssured.given()
            .header("Content-Type", ContentType.JSON)
            .body(faultyEntry)
            .post("/goals/create")
            .then()
            .assertThat()
            .statusCode(400)
    }

    @Test
    fun `should create and read an entry`() {
        val created = RestAssured.given()
            .header("Content-Type", ContentType.JSON)
            .body(goal(id = 2, userId = 1))
            .post("/goals/create")
            .then()

        created.assertThat().statusCode(201)

        val createdEntry = created.extract().body().`as`(Goal::class.java)

        val read = RestAssured.given().get("/goals/read/${createdEntry.userId}/${createdEntry.added}/${createdEntry.id}")
            .then()

        read.assertThat().statusCode(200)

        val readEntry = read.extract().body().`as`(Goal::class.java)

        assert(createdEntry.added == readEntry.added)
        assert(createdEntry.id == readEntry.id)
        assert(createdEntry.userId == readEntry.userId)
        assert(createdEntry.startAmount == readEntry.startAmount)
        assert(createdEntry.endAmount == readEntry.endAmount)
        assert(createdEntry.startDate == readEntry.startDate)
        assert(createdEntry.endDate == readEntry.endDate)
    }

    @Test
    fun `should create, update and read an entry`() {
        val entry = goal(id = 1, userId = 4)

        val assured = RestAssured.given()
            .header("Content-Type", ContentType.JSON)
            .body(entry)
            .post("/goals/create")
            .then()

        assured.assertThat().statusCode(201)

        val created = assured.extract().body().`as`(Goal::class.java)
        created.endAmount = 80.4f

        RestAssured.given()
            .header("Content-Type", ContentType.JSON)
            .body(created)
            .put("/goals/update")
            .then()
            .assertThat()
            .statusCode(200)

        val assuredRead = RestAssured.given().get("/goals/read/${created.userId}/${created.added}/${created.id}").then()

        assuredRead.assertThat().statusCode(200)

        val updated = assuredRead.extract().body().`as`(Goal::class.java)

        assert(created.id == updated.id)
        assert(entry.endAmount != updated.endAmount)
        assert(updated.updated != null)
    }

    @Test
    fun `should fail on update`() {
        RestAssured.given()
            .header("Content-Type", ContentType.JSON)
            .body(goal(id = 43L, userId = 1))
            .put("/goals/update")
            .then()
            .assertThat()
            .statusCode(404)
    }

    @Test
    fun `should create and delete an entry`() {
        val assured = RestAssured.given()
            .header("Content-Type", ContentType.JSON)
            .body(goal(id = 1, userId = 1))
            .post("/goals/create")
            .then()

        assured.assertThat().statusCode(201)

        val created = assured.extract().body().`as`(Goal::class.java)

        RestAssured.given().delete("/goals/delete/${created.userId}/${created.added}/${created.id}").then().assertThat().statusCode(200)
    }

    @Test
    fun `should fail on delete`() {
        val calorieTrackerId = 123L

        RestAssured.given().delete("/goals/delete/$calorieTrackerId").then().assertThat().statusCode(404)
    }

    @Test
    fun `should create and delete an entry and fail on read`() {
        val assured = RestAssured.given()
            .header("Content-Type", ContentType.JSON)
            .body(goal(id = 3, userId = 1))
            .post("/goals/create")
            .then()
            .assertThat().statusCode(201)

        val createdEntry = assured.extract().body().`as`(Goal::class.java)

        RestAssured.given()
            .delete("/goals/delete/${createdEntry.userId}/${createdEntry.added}/${createdEntry.id}")
            .then()
            .assertThat()
            .statusCode(200)

        RestAssured.given()
            .get("/goals/read/${createdEntry.userId}/${createdEntry.added}/${createdEntry.id}")
            .then()
            .assertThat()
            .statusCode(404)
    }

    @Test
    fun `should fail on finding last entry`() {
        val userId = 72L

        RestAssured
            .given()
            .get("/goals/last/$userId")
            .then().assertThat().statusCode(404)
    }

    @Test
    fun `should create two entries and find the last`() {
        val goal = goal(id = 1, 73L)
        goal.startAmount = 100f
        goal.endAmount = 200f

        val lastGoal = goal(id = 2, 73L)
        lastGoal.startAmount = 50f
        lastGoal.endAmount = 250f

        listOf(goal, lastGoal).forEach { item ->
            RestAssured.given()
                .header("Content-Type", ContentType.JSON)
                .body(item)
                .post("/goals/create")
                .then()
                .assertThat()
                .statusCode(201)
        }

        val assured = RestAssured.given().get("/goals/last/${goal.userId}").then()
        val found = assured.extract().body().`as`(Goal::class.java)

        assert(found.added == lastGoal.added)
        assert(found.id == lastGoal.id)
        assert(found.userId == lastGoal.userId)
        assert(found.startAmount == lastGoal.startAmount)
        assert(found.endAmount == lastGoal.endAmount)
    }

    private fun goal(id: Long, userId: Long): Goal {
        val goal = Goal(
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusYears(1),
            startAmount = 95.3f,
            endAmount = 75.4f
        )

        goal.id = id
        goal.userId = userId
        goal.added = LocalDate.now()

        return goal
    }
}