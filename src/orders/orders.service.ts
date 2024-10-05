import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/pagination-order';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit{

  private readonly logger = new Logger('OrdersService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');
  }

  create(createOrderDto: CreateOrderDto) {
    // Agrega a la base de datos
    return this.order.create({
      data: createOrderDto,
    })
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {

    const totalPages = await this.order.count({
      where: {
        status: orderPaginationDto.status,
      }
    });

    const currentPage = orderPaginationDto.page;
    const perPage = orderPaginationDto.limit;

    return{
      data: await this.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where: {
          status: orderPaginationDto.status,
        },
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages / perPage),
      }
    }

    // return this.order.findMany();
  }

  async findOne(id: string) {
    const order = await this.order.findUnique({
      where: { id: id,},
    });

    if (!order) {
      throw new RpcException({status: HttpStatus.NOT_FOUND, message: `Order ${id} not found`});
    }
    return order;

  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {

    const {id, status} = changeOrderStatusDto;

    const order = await this.findOne(id)

    // Si el estatus es el mismo que la base de datos no hace nada
    if(order.status === status){
      return order;
    }
    
    return this.order.update({
      where: { id: id },
      data: { status: status },
    })

  }
}
