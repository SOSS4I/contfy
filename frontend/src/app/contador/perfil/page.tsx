'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PerfilPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para configurações que já tem o perfil
    router.replace('/contador/configuracoes')
  }, [router])

  return null
}
