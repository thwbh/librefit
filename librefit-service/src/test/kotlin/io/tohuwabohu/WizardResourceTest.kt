package io.tohuwabohu

import io.quarkus.test.common.http.TestHTTPEndpoint
import io.quarkus.test.junit.QuarkusTest
import io.quarkus.test.vertx.RunOnVertxContext
import io.quarkus.test.vertx.UniAsserter
import io.restassured.module.kotlin.extensions.Extract
import io.restassured.module.kotlin.extensions.Then
import io.restassured.module.kotlin.extensions.When
import io.tohuwabohu.calc.BmiCategory
import io.tohuwabohu.calc.CalculationGoal
import io.tohuwabohu.calc.CalculationSex
import io.tohuwabohu.calc.Wizard
import io.tohuwabohu.calc.WizardInput
import io.tohuwabohu.calc.WizardResult
import jakarta.inject.Inject
import org.hamcrest.Matchers
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import java.time.LocalDate

@QuarkusTest
@TestHTTPEndpoint(WizardResource::class)
class WizardResourceTest {

    @Inject
    private lateinit var wizard: Wizard

    private val calculationStartDate = LocalDate.of(2024, 5, 1)

    @Test
    fun `should calculate weight loss for men`() {
        val params = WizardInput(
            age = 30,
            weight = 90,
            height = 180,
            weeklyDifference = 5,
            activityLevel = 1.5f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.MALE
        )

        val wizardResult: WizardResult = When {
            get("/calculate/${params.age}/${params.sex}/${params.weight}/${params.height}/${params.activityLevel}/${params.weeklyDifference}/${params.calculationGoal}")
        } Then {
            statusCode(200)
        } Extract {
            body().`as`(WizardResult::class.java)
        }

        Assertions.assertEquals(wizardResult.bmr, 1995f)
        Assertions.assertEquals(wizardResult.deficit, 500f)
        Assertions.assertEquals(wizardResult.bmi, 28f)
        Assertions.assertEquals(wizardResult.tdee, 2992.0)
        Assertions.assertEquals(wizardResult.bmiCategory, BmiCategory.OVERWEIGHT)
        Assertions.assertEquals(wizardResult.targetBmi.first, 20)
        Assertions.assertEquals(wizardResult.targetBmi.last, 25)
        Assertions.assertEquals(wizardResult.targetWeight, 73f)
        Assertions.assertEquals(wizardResult.target, 2492f)
        Assertions.assertEquals(wizardResult.durationDays, 238.0)
    }

    @Test
    fun `should calculate weight gain for women`() {
        val params = WizardInput(
            age = 25,
            weight = 52,
            height = 155,
            weeklyDifference = 1,
            activityLevel = 1.25f,
            calculationGoal = CalculationGoal.GAIN,
            sex = CalculationSex.FEMALE
        )

        val wizardResult: WizardResult = When {
            get("/calculate/${params.age}/${params.sex}/${params.weight}/${params.height}/${params.activityLevel}/${params.weeklyDifference}/${params.calculationGoal}")
        } Then {
            statusCode(200)
        } Extract {
            body().`as`(WizardResult::class.java)
        }

        Assertions.assertEquals(wizardResult.bmr, 1316f)
        Assertions.assertEquals(wizardResult.deficit, 100f)
        Assertions.assertEquals(wizardResult.bmi, 22f)
        Assertions.assertEquals(wizardResult.tdee, 1645.0)
        Assertions.assertEquals(wizardResult.bmiCategory, BmiCategory.STANDARD_WEIGHT)
        Assertions.assertEquals(wizardResult.targetBmi.first, 20)
        Assertions.assertEquals(wizardResult.targetBmi.last, 25)
        Assertions.assertEquals(wizardResult.targetWeight, 54f)
        Assertions.assertEquals(wizardResult.target, 1745f)
        Assertions.assertEquals(wizardResult.durationDays, 140.0)
    }

    @Test
    fun `should fail with invalid age`() {
        val params = WizardInput(
            age = 13,
            weight = 45,
            height = 160,
            weeklyDifference = 0,
            activityLevel = 1.5f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.FEMALE
        )

        When {
            get("/calculate/${params.age}/${params.sex}/${params.weight}/${params.height}/${params.activityLevel}/${params.weeklyDifference}/${params.calculationGoal}")
        } Then {
            statusCode(400)
            body("errors[0].field", Matchers.equalTo("age"))
        }
    }

    @Test
    fun `should fail with invalid weight`() {
        val params = WizardInput(
            age = 30,
            weight = 20,
            height = 160,
            weeklyDifference = 0,
            activityLevel = 1.5f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.FEMALE
        )

        When {
            get("/calculate/${params.age}/${params.sex}/${params.weight}/${params.height}/${params.activityLevel}/${params.weeklyDifference}/${params.calculationGoal}")
        } Then {
            statusCode(400)
            body("errors[0].field", Matchers.equalTo("weight"))
        }
    }

    @Test
    fun `should fail with invalid height`() {
        val params = WizardInput(
            age = 30,
            weight = 45,
            height = 340,
            weeklyDifference = 0,
            activityLevel = 1.5f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.FEMALE
        )

        When {
            get("/calculate/${params.age}/${params.sex}/${params.weight}/${params.height}/${params.activityLevel}/${params.weeklyDifference}/${params.calculationGoal}")
        } Then {
            statusCode(400)
            body("errors[0].field", Matchers.equalTo("height"))
        }
    }

    @Test
    fun `should fail with invalid weekly difference`() {
        @Test
        fun `should fail with invalid height`() {
            val params = WizardInput(
                age = 30,
                weight = 45,
                height = 160,
                weeklyDifference = 8,
                activityLevel = 1.5f,
                calculationGoal = CalculationGoal.GAIN,
                sex = CalculationSex.FEMALE
            )

            When {
                get("/calculate/${params.age}/${params.sex}/${params.weight}/${params.height}/${params.activityLevel}/${params.weeklyDifference}/${params.calculationGoal}")
            } Then {
                statusCode(400)
                body("errors[0].field", Matchers.equalTo("weeklyDifference"))
            }
        }
    }

    @Test
    fun `should fail with invalid activity level`() {
        val params = WizardInput(
            age = 30,
            weight = 45,
            height = 160,
            weeklyDifference = 0,
            activityLevel = 0.5f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.FEMALE
        )

        When {
            get("/calculate/${params.age}/${params.sex}/${params.weight}/${params.height}/${params.activityLevel}/${params.weeklyDifference}/${params.calculationGoal}")
        } Then {
            statusCode(400)
            body("errors[0].field", Matchers.equalTo("activityLevel"))
        }
    }

    @Test
    fun `should fail with 404`() {
        var params = WizardInput(
            age = -30,
            weight = 45,
            height = 160,
            weeklyDifference = 0,
            activityLevel = 0.5f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.FEMALE
        )

        When {
            get("/calculate/${params.age}/${params.sex}/${params.weight}/${params.height}/${params.activityLevel}/${params.weeklyDifference}/${params.calculationGoal}")
        } Then {
            statusCode(404)
        }

        params = WizardInput(
            age = 30,
            weight = -45,
            height = 160,
            weeklyDifference = 0,
            activityLevel = 0.5f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.FEMALE
        )

        When {
            get("/calculate/${params.age}/${params.sex}/${params.weight}/${params.height}/${params.activityLevel}/${params.weeklyDifference}/${params.calculationGoal}")
        } Then {
            statusCode(404)
        }

        params = WizardInput(
            age = 30,
            weight = 45,
            height = -160,
            weeklyDifference = 0,
            activityLevel = 0.5f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.FEMALE
        )

        When {
            get("/calculate/${params.age}/${params.sex}/${params.weight}/${params.height}/${params.activityLevel}/${params.weeklyDifference}/${params.calculationGoal}")
        } Then {
            statusCode(404)
        }
    }

    @Test
    @RunOnVertxContext
    fun `should calculate and return underweight, obese and severely obese for men`(uniAsserter: UniAsserter) {
        val underweight1 = WizardInput(
            age = 25,
            weight = 60,
            height = 180,
            weeklyDifference = 0,
            activityLevel = 1f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.MALE
        )

        val obese1 = WizardInput(
            age = 25,
            weight = 130,
            height = 180,
            weeklyDifference = 0,
            activityLevel = 1f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.MALE
        )

        val obese2 = WizardInput(
            age = 45,
            weight = 150,
            height = 180,
            weeklyDifference = 0,
            activityLevel = 1f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.MALE
        )


        uniAsserter.assertThat(
            { wizard.calculate(underweight1)},
            { result -> Assertions.assertEquals(BmiCategory.UNDERWEIGHT, result.bmiCategory)}
        )

        uniAsserter.assertThat(
            { wizard.calculate(obese1) },
            { result -> Assertions.assertEquals(BmiCategory.OBESE, result.bmiCategory)}
        )

        uniAsserter.assertThat(
            { wizard.calculate(obese2) },
            { result -> Assertions.assertEquals(BmiCategory.SEVERELY_OBESE, result.bmiCategory)}
        )
    }

    @Test
    @RunOnVertxContext
    fun `should calculate and return underweight, obese and severely obese for women`(uniAsserter: UniAsserter) {
        val underweight1 = WizardInput(
            age = 18,
            weight = 40,
            height = 150,
            weeklyDifference = 0,
            activityLevel = 1f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.FEMALE
        )

        val obese1 = WizardInput(
            age = 30,
            weight = 80,
            height = 160,
            weeklyDifference = 0,
            activityLevel = 1f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.FEMALE
        )

        val obese2 = WizardInput(
            age = 45,
            weight = 120,
            height = 165,
            weeklyDifference = 0,
            activityLevel = 1f,
            calculationGoal = CalculationGoal.LOSS,
            sex = CalculationSex.FEMALE
        )


        uniAsserter.assertThat(
            { wizard.calculate(underweight1)},
            { result -> Assertions.assertEquals(BmiCategory.UNDERWEIGHT, result.bmiCategory)}
        )

        uniAsserter.assertThat(
            { wizard.calculate(obese1) },
            { result -> Assertions.assertEquals(BmiCategory.OBESE, result.bmiCategory)}
        )

        uniAsserter.assertThat(
            { wizard.calculate(obese2) },
            { result -> Assertions.assertEquals(BmiCategory.SEVERELY_OBESE, result.bmiCategory)}
        )
    }

    @Test
    @RunOnVertxContext
    fun `should warn for underweight target`(uniAsserter: UniAsserter) {
        uniAsserter.assertThat(
            { wizard.calculateForTargetWeight(calculationStartDate, 30, 170, 60, CalculationSex.MALE, 50) },
            { result ->
                Assertions.assertEquals(BmiCategory.UNDERWEIGHT, result.targetClassification)
                Assertions.assertEquals(true, result.warning)
                Assertions.assertEquals("Your target weight will classify you as underweight. You should revisit your choice.", result.message)
            }
        )
    }

    @Test
    @RunOnVertxContext
    fun `should warn for obese target`(uniAsserter: UniAsserter) {
        uniAsserter.assertThat(
            { wizard.calculateForTargetWeight(calculationStartDate, 30, 170, 60, CalculationSex.MALE, 110) },
            { result ->
                Assertions.assertEquals(BmiCategory.OBESE, result.targetClassification)
                Assertions.assertEquals(true, result.warning)
                Assertions.assertEquals("Your target weight will classify you as obese. You should revisit your choice.", result.message)
            }
        )
    }

    @Test
    @RunOnVertxContext
    fun `should warn for severely obese target`(uniAsserter: UniAsserter) {
        uniAsserter.assertThat(
            { wizard.calculateForTargetWeight(calculationStartDate, 30, 170, 60, CalculationSex.MALE, 150) },
            { result ->
                Assertions.assertEquals(BmiCategory.SEVERELY_OBESE, result.targetClassification)
                Assertions.assertEquals(true, result.warning)
                Assertions.assertEquals("Your target weight will classify you as severely obese. You should revisit your choice.", result.message)
            }
        )
    }

    @Test
    @RunOnVertxContext
    fun `should calculate weight loss duration`(uniAsserter: UniAsserter) {
        val expected = mapOf(
            100 to 1190,
            200 to 595,
            300 to 397,
            400 to 298,
            500 to 238,
            600 to 198,
            700 to 170
        )

        uniAsserter.assertThat(
            { wizard.calculateForTargetWeight(calculationStartDate, 30, 170, 100, CalculationSex.MALE, 83) },
            { result ->
                Assertions.assertEquals(BmiCategory.OVERWEIGHT, result.targetClassification)
                Assertions.assertEquals(false, result.warning)
                Assertions.assertEquals("", result.message)

                expected.forEach { (rate, differenceDays) -> Assertions.assertEquals(calculationStartDate.plusDays(differenceDays.toLong()), result.datePerRate[rate]) }
            }
        )
    }

    @Test
    @RunOnVertxContext
    fun `should calculate weight gain duration`(uniAsserter: UniAsserter) {
        val expected = mapOf(
            100 to 350,
            200 to 175,
            300 to 117,
            400 to 88,
            500 to 70,
            600 to 58,
            700 to 50
        )

        uniAsserter.assertThat(
            { wizard.calculateForTargetWeight(calculationStartDate,30, 155, 45, CalculationSex.FEMALE, 50) },
            { result ->
                Assertions.assertEquals(BmiCategory.STANDARD_WEIGHT, result.targetClassification)
                Assertions.assertEquals(false, result.warning)
                Assertions.assertEquals("", result.message)

                expected.forEach { (rate, differenceDays) -> Assertions.assertEquals(calculationStartDate.plusDays(differenceDays.toLong()), result.datePerRate[rate]) }
            }
        )
    }

    @Test
    @RunOnVertxContext
    fun `should calculate target weights for specific weight loss goal`(uniAsserter: UniAsserter) {
        val targetDate = LocalDate.now().plusDays(250) // suppose we set the target date 250 days later
        val rates = listOf(100, 200, 300, 400, 500)

        val expectedWeightByRate = mapOf(
            100 to 82f,
            200 to 78f,
            300 to 75f,
            400 to 71f,
            500 to 68f
        )

        val expectedBmiByRate = mapOf(
            100 to 28f,
            200 to 27f,
            300 to 26f,
            400 to 25f,
            500 to 24f
        )

        uniAsserter.assertThat(
            { wizard.calculateForTargetDate(30, 170, 85f, CalculationSex.MALE, targetDate, CalculationGoal.LOSS) },
            { result ->
                rates.forEach { rate ->
                    val resultForRate = result.resultByRate[rate]!!

                    Assertions.assertEquals(expectedWeightByRate[rate], resultForRate.targetWeight)
                    Assertions.assertEquals(expectedBmiByRate[rate], resultForRate.bmi)
                }
            }
        )
    }

    @Test
    @RunOnVertxContext
    fun `should calculate target weights for specific weight gain goal`(uniAsserter: UniAsserter) {
        val targetDate = LocalDate.now().plusDays(150) // suppose we set the target date 150 days later
        val rates = listOf(100, 200, 300, 400, 500)

        val expectedWeightByRate = mapOf(
            100 to 47f,
            200 to 49f,
            300 to 51f,
            400 to 53f,
            500 to 55f,
            600 to 57f,
            700 to 59f
        )

        val expectedBmiByRate = mapOf(
            100 to 20f,
            200 to 20f,
            300 to 21f,
            400 to 22f,
            500 to 23f,
            600 to 24f,
            700 to 25f
        )

        uniAsserter.assertThat(
            { wizard.calculateForTargetDate(30, 155, 45f, CalculationSex.FEMALE, targetDate, CalculationGoal.GAIN) },
            { result ->
                rates.forEach { rate ->
                    val resultForRate = result.resultByRate[rate]!!

                    Assertions.assertEquals(expectedWeightByRate[rate], resultForRate.targetWeight)
                    Assertions.assertEquals(expectedBmiByRate[rate], resultForRate.bmi)
                }
            }
        )
    }

    @Test
    @RunOnVertxContext
    fun `should filter non-recommendable results for weight loss goal`(uniAsserter: UniAsserter) {
        val targetDate = LocalDate.now().plusDays(300) // suppose we set the target date 300 days later

        uniAsserter.assertThat(
            { wizard.calculateForTargetDate(30, 170, 60f, CalculationSex.MALE, targetDate, CalculationGoal.LOSS) },
            { result ->
                result.resultByRate.values.forEach { ratedResult ->
                    Assertions.assertNotEquals(BmiCategory.UNDERWEIGHT, ratedResult.bmiCategory)
                }
            }
        )
    }

    @Test
    @RunOnVertxContext
    fun `should filter non-recommendable results for weight gain goal`(uniAsserter: UniAsserter) {
        val targetDate = LocalDate.now().plusDays(300) // suppose we set the target date 300 days later

        uniAsserter.assertThat(
            { wizard.calculateForTargetDate(30, 155, 45f, CalculationSex.FEMALE, targetDate, CalculationGoal.GAIN) },
            { result ->
                result.resultByRate.values.forEach { ratedResult ->
                    Assertions.assertTrue(ratedResult.bmiCategory != BmiCategory.OBESE && ratedResult.bmiCategory != BmiCategory.SEVERELY_OBESE)
                }
            }
        )
    }
}