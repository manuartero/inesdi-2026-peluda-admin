import { DATA } from '@/data/peluda.data.ts'

export const findCustomer = (id: string | undefined) => DATA.customers.find((customer) => customer.id === id)

export const petsOf = (customerId: string | undefined) => DATA.pets.filter((pet) => pet.customerId === customerId)
