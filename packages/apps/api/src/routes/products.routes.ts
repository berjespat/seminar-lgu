import { Router } from "express";
import { createProductsHandler, fetchProductsHandler } from '../handlers/products.handler';

export const productsRouter = Router()

productsRouter.post("/", createProductsHandler);
productsRouter.get("/", fetchProductsHandler);