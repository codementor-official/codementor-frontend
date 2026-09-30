import { PurchasesScreen } from '@/features/commerce/purchases-screen';
export default async function Page({params}:{params:Promise<{orderId:string}>}){const {orderId}=await params;return <PurchasesScreen orderId={orderId}/>;}
