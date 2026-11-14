import { ListCustomerOrdersUseCase } from "./orders/application/use-cases/list-customer-orders.use-case";
import type { OrderProps } from "./orders/domain/schemas/order.schema";
import { OrderRepositoryImplementation } from "./orders/infrastructure/repository-implementations/order.repository-implementation";
import { ordersAdapter } from "./orders/infrastructure/adapters/orders.adapter";
export { ListCustomerOrdersUseCase };
const useCase = new ListCustomerOrdersUseCase(new OrderRepositoryImplementation(ordersAdapter));
export const listCustomerOrders: (customerId: string) => Promise<OrderProps[]> = (customerId) => useCase.execute(customerId);
