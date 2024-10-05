import { Catch, RpcExceptionFilter, ArgumentsHost, UnauthorizedException, ExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter{
  catch(exception: RpcException, host: ArgumentsHost) {

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const rpcError = exception.getError();
    // console.error('RpcCustomExceptionFilter', error);

    if (typeof rpcError === 'object' && 'status' in rpcError && 'message' in rpcError) {
      // const status = rpcError.status;
      const status = isNaN(+rpcError.status) ? 400 : +rpcError.status;
      return response.status(status).json(rpcError);
    }

    response.status(400).json({
      status: 400,
      message:rpcError,
    })

    // throw new UnauthorizedException("Nose xd");
    // return throwError(() => exception.getError());
  }
}