import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/pagination-order';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { PRODUCT_SERVICE } from 'src/config';
import { read } from 'fs';
import { firstValueFrom } from 'rxjs';
import { OrderItemDto } from './dto/order-item.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit{


  private readonly logger = new Logger('OrdersService');

  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy,
  ) {
    super();
  }
  

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      // Obtener los IDs de los productos
      const productsIds = createOrderDto.items.map((item) => item.productId);
      
      // Validar productos a través del microservicio
      const products: any[] = await firstValueFrom(
        this.productsClient.send({ cmd: 'validate_product' }, productsIds)
      );
  
      // Calculo del totalAmount sumando el precio * cantidad para cada producto
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const product = products.find(
          (product) => product.id === orderItem.productId
        );
        
        if (!product) {
          throw new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: `Producto con ID ${orderItem.productId} no encontrado`,
          });
        }
  
        return acc + product.price * orderItem.quantity;
      }, 0);
  
      // Calculo del total de items
      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);
  
      // Crear la orden en la base de datos, incluyendo los OrderItems
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          items: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(product => product.id === orderItem.productId).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          items: {
            select:{
              price: true,
              productId: true,
              quantity: true,
            }
          },
        }
      });
      
  
      // Retornar la orden creada
      return {
        ...order,
        items: order.items.map((orderItem) => ({
          ...orderItem,
          name: products.find(product => product.id === orderItem.productId).name,
        }))
      };
    } catch (error) {
      // Capturar cualquier error y lanzar una excepción RPC
      console.error('Error al procesar la orden:', error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Error en la creación de la orden. Revisa los logs.',
      });
    }
  }
  
  
  
    // Agrega a la base de datos
    // return {
    //   service: 'Orders Microservice',
    //   createOrderDto: createOrderDto,
    // }
    
    // return this.order.create({
    //   data: createOrderDto,
    // })
  

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
      include:{
        items: {
          select:{
            price: true,
            productId: true,
            quantity: true,
          }
        }
      }
    });

    if (!order) {
      throw new RpcException({status: HttpStatus.NOT_FOUND, message: `Order ${id} not found`});
    }

    const productsIds = order.items.map(p => p.productId);
    const products: any[] = await firstValueFrom(
      this.productsClient.send({ cmd: 'validate_product' }, productsIds)
    );

    return {
      ...order,
      items: order.items.map((orderItem) => ({
        ...orderItem,
        name: products.find(product => product.id === orderItem.productId).name,
      }))
    };
    


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
