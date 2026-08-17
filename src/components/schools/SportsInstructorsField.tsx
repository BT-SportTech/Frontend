import type { SportsInstructorFormRow } from '../../lib/sportsInstructors'
import { emptySportsInstructorRow } from '../../lib/sportsInstructors'
import { Button, FieldLabel, TextInput } from '../ui'

interface SportsInstructorsFieldProps {
  value: SportsInstructorFormRow[]
  onChange: (value: SportsInstructorFormRow[]) => void
}

function MemberRow({
  index,
  member,
  canRemove,
  onUpdate,
  onRemove,
}: {
  index: number
  member: SportsInstructorFormRow
  canRemove: boolean
  onUpdate: (patch: Partial<SportsInstructorFormRow>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-lg border border-line/80 bg-accent/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
          Member {index + 1}
        </p>
        {canRemove ? (
          <Button type="button" variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <FieldLabel>Name</FieldLabel>
          <TextInput
            value={member.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Coach name"
          />
        </div>
        <div className="min-w-0">
          <FieldLabel>Phone number</FieldLabel>
          <TextInput
            value={member.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>
    </div>
  )
}

export function SportsInstructorsField({
  value,
  onChange,
}: SportsInstructorsFieldProps) {
  const rows = value.length > 0 ? value : [emptySportsInstructorRow()]

  function updateRow(index: number, patch: Partial<SportsInstructorFormRow>) {
    onChange(
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [emptySportsInstructorRow()])
  }

  function addRow() {
    onChange([...rows, emptySportsInstructorRow()])
  }

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel>Sports instructors</FieldLabel>
        <p className="mt-1 text-xs text-ink/45">
          Optional — add one or more sports staff with contact numbers.
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((member, index) => (
          <MemberRow
            key={index}
            index={index}
            member={member}
            canRemove={rows.length > 1}
            onUpdate={(patch) => updateRow(index, patch)}
            onRemove={() => removeRow(index)}
          />
        ))}
      </div>
      <Button type="button" variant="ghost" onClick={addRow}>
        + Add member
      </Button>
    </div>
  )
}
