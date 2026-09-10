import InventoryWorkspace from '@/components/inventory-workspace'
import { inventory, marketplaces } from '@/lib/listings'

export default function Home() {
  return <InventoryWorkspace inventory={inventory} marketplaces={marketplaces} />
}
