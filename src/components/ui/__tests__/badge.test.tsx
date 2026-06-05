import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../badge'

describe('Badge', () => {
  it('renderiza o conteúdo passado', () => {
    render(<Badge>Win</Badge>)
    expect(screen.getByText('Win')).toBeInTheDocument()
  })

  it('aplica classe da variante "loss"', () => {
    render(<Badge variant="loss">Loss</Badge>)
    expect(screen.getByText('Loss')).toHaveClass('text-loss')
  })

  it('mescla className extra sem perder as classes base', () => {
    render(<Badge className="extra-xyz">BE</Badge>)
    const el = screen.getByText('BE')
    expect(el).toHaveClass('extra-xyz')
    expect(el).toHaveClass('rounded-full')
  })
})
