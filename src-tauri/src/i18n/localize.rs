use validator::{ValidationError, ValidationErrors};

pub fn localize_validation_errors(validation_errors: &ValidationErrors) -> ValidationErrors {
    let mut localized_validation_errors = ValidationErrors::new();

    validation_errors
        .field_errors()
        .into_iter()
        .for_each(|(field, field_errors)| {
            field_errors.iter().for_each(|field_error| {
                localized_validation_errors.add(field, localize_validation_error(field_error))
            })
        });

    localized_validation_errors
}

fn localize_validation_error(validation_error: &ValidationError) -> ValidationError {
    let error_code = validation_error.code.clone();
    let error_params = validation_error.params.clone();

    let localized_message = t!(error_code.into_owned());

    ValidationError {
        code: validation_error.code.clone(),
        message: localized_message.into(),
        params: error_params,
    }
}
