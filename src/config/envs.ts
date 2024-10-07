
import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars{
    PORT: number;
    HOST: string;
    PRODUCT_MICROSERVICE_HOST: string;
    PRODUCT_MICROSERVICE_PORT: number;
}


const envScheme = joi.object({
    PORT: joi.number().required(),
    HOST: joi.string().required(),
    PRODUCT_MICROSERVICE_HOST: joi.string().required(),
    PRODUCT_MICROSERVICE_PORT: joi.number().required(),
})
.unknown();


const {error, value} = envScheme.validate(process.env);

if(error){
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    port: envVars.PORT,
    host: envVars.HOST,
    productMicroserviceHost: envVars.PRODUCT_MICROSERVICE_HOST,
    productMicroservicePort: envVars.PRODUCT_MICROSERVICE_PORT,
}