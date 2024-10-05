
import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars{
    PORT: number;
    HOST: string;
}


const envScheme = joi.object({
    PORT: joi.number().required(),
    HOST: joi.string().required(),
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
}