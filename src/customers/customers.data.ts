import { HANDWRITTEN } from '@/data/handwritten.data.ts'

export const findCustomer = (id: string | undefined) => HANDWRITTEN.customers.find((customer) => customer.id === id)

export const petsOf = (customerId: string | undefined) => HANDWRITTEN.pets.filter((pet) => pet.customerId === customerId)
