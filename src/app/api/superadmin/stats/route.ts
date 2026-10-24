import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

async function verifySuperadmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const supabase = createServiceClient()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (!superadminEmail || user.email !== superadminEmail) return null
  return user
}

// GET /api/superadmin/stats — dashboard numbers
export async function GET(req: NextRequest) {
  const admin = await verifySuperadmin(req)
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const supabase = createServiceClient()

  const [storesRes, activeRes, ordersRes] = await Promise.all([
    supabase.from('stores').select('id', { count: 'exact', head: true }),
    supabase.from('stores').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
  ])

  // Monthly breakdown (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: monthly } = await supabase
    .from('stores')
    .select('created_at')
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at')

  // Group by month
  const monthlyMap: Record<string, number> = {}
  for (const s of (monthly ?? [])) {
    const month = s.created_at.slice(0, 7) // "2024-10"
    monthlyMap[month] = (monthlyMap[month] ?? 0) + 1
  }

  return NextResponse.json({
    total_stores: storesRes.count ?? 0,
    active_stores: activeRes.count ?? 0,
    total_orders: ordersRes.count ?? 0,
    monthly_signups: monthlyMap,
  })
}
