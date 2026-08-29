import { Request, Response } from "express";
import { PrismaPg } from '@prisma/adapter-pg'
import {  z } from 'zod'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });


const createProductSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number({ error: "Price is required and must be a number" }).positive({ message: "Price must be greater than 0" }),
    image: z.string().optional()
})

const getProductQuerySchema = z.object({
    limit: z.coerce.number().int().positive().default(5),
    offset: z.coerce.number().min(0).default(0)
})

export const createProductsHandler = async (req: Request, res: Response) => {
    console.log(req.body)
    const result = createProductSchema.safeParse(req.body)
    if (!result.success) {
        return res.status(400).json({
            message: 'Invalid product data',
            error: z.flattenError(result.error).fieldErrors,
        })
    }

    const { name, description, price, image } = result.data;

    const existingProduct = await prisma.product.findFirst({
        where: {
            name: {
                equals: name,
                mode: "insensitive"
            }
        }
    });

    if (existingProduct) {
        return res.status(405).json({ message: "Product already exist!" })
    }

    const product = await prisma.product.create({
        data: { name, description, price, image }
    });

    return res.status(201).json(product)
}

export const fetchProductsHandler = async (req: Request, res: Response) => {
    const result = getProductQuerySchema.safeParse(req.query)

    if (!result.success) {
        return res.status(400).json({
            message: 'Invalid query parameters',
            errors: z.flattenError(result.error).fieldErrors,
        })
    }

    const { limit, offset } = result.data;
    const [count, data] = await Promise.all([
        prisma.product.count(),
        prisma.product.findMany({ take: limit, skip: offset }),
    ]);

    return res.status(200).send({ count, data })
}