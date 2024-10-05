import { IsEnum, IsOptional } from "class-validator";
import { OrderStatusList } from "../enum/oder.enum";
import { PaginationDto } from "src/common";
import { OrderStatus } from "@prisma/client";


export class OrderPaginationDto extends PaginationDto {

    @IsOptional()
    @IsEnum(OrderStatusList, {
        message: `Valid status are ${OrderStatusList}`,
    })
    status: OrderStatus

}