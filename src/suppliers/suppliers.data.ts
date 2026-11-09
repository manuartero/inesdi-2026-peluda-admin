import { DATA } from '@/data/peluda.data.ts'
import { dataError } from '@/data/json-row.reader.ts'
import type { Contract, Supplier, WithoutAnswerKey } from '@/data/model.types.ts'

// Keys are paths like `../../data/handwritten/contracts/nutrican.md`; `pnpm check:data` already checks each file exists.
const CONTRACT_TEXTS = import.meta.glob<string>('../../data/handwritten/contracts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function withText(contract: WithoutAnswerKey<Contract>) {
  const text = CONTRACT_TEXTS[`../../data/handwritten/${contract.file}`]
  if (text === undefined) {
    throw dataError(`${contract.id} › file: ${contract.file} not found`)
  }
  return { ...contract, text }
}

export type ShownContract = ReturnType<typeof withText>

const CONTRACTS = DATA.contracts.map(withText)

function withContract(supplier: Supplier) {
  return { ...supplier, contract: CONTRACTS.find((contract) => contract.id === supplier.contractId) }
}

export type SupplierWithContract = ReturnType<typeof withContract>

export const SUPPLIERS = DATA.suppliers.map(withContract)

export const findSupplier = (id: string | undefined) => SUPPLIERS.find((supplier) => supplier.id === id)
