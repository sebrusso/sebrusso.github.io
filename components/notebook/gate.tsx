'use client'

import { useState } from 'react'
import { personFromName } from '../../lib/notebook/people'
import { useNotebook } from '../../lib/notebook/store'

// Name-only login (decided in the design doc). Nothing else on the page
// renders, and no eval data loads, until a known name is entered.
export function Gate() {
  const { login } = useNotebook()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  return (
    <div className="min-h-[60vh] grid place-items-center py-16">
      <form
        className="w-full max-w-sm flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          const person = personFromName(name)
          if (person) login(person)
          else setError("We don't recognize that name.")
        }}
      >
        <label htmlFor="nb-name" className="text-2xl font-semibold tracking-tight">
          What&apos;s your name?
        </label>
        <input
          id="nb-name"
          autoFocus
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          className="h-11 rounded-md border border-input bg-background px-3 text-base"
          aria-describedby={error ? 'nb-name-error' : undefined}
        />
        {error && (
          <p id="nb-name-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <button type="submit" className="h-11 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90">
          Continue
        </button>
      </form>
    </div>
  )
}
