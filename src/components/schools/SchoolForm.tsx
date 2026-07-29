import type { ReactNode } from 'react'
import type { SchoolFormState } from '../../interfaces/school.interface'
import { SCHOOL_TYPES } from '../../interfaces/school.interface'
import {
  getCities,
  getDistricts,
  getStates,
  withCurrentOption,
} from '../../lib/locations'
import {
  CheckboxField,
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput,
} from '../ui'
import { FormSection } from './FormSection'
import { LogoUploadField } from './LogoUploadField'

interface SchoolFormProps {
  step: number
  form: SchoolFormState
  editing: boolean
  onChange: <K extends keyof SchoolFormState>(
    key: K,
    value: SchoolFormState[K],
  ) => void
}

function Field({
  label,
  className = '',
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}

export function SchoolForm({ step, form, editing, onChange }: SchoolFormProps) {
  switch (step) {
    case 0:
      return (
        <FormSection title="Basic school information">
          <Field label="School name" className="sm:col-span-2">
            <TextInput
              required
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="Enter school name"
            />
          </Field>
          <Field label="School code / registration number">
            <TextInput
              required
              value={form.code}
              onChange={(e) => onChange('code', e.target.value)}
              disabled={editing}
              placeholder="e.g. ST001"
            />
          </Field>
          <Field label="School type">
            <SelectInput
              value={form.type}
              onChange={(e) =>
                onChange('type', e.target.value as SchoolFormState['type'])
              }
            >
              {SCHOOL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll('_', ' ')}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="sm:col-span-2">
            <LogoUploadField
              logoUrl={form.logoUrl}
              logoFile={form.logoFile}
              onSelect={(file) => onChange('logoFile', file)}
              onClear={() => {
                onChange('logoFile', null)
                onChange('logoUrl', '')
              }}
            />
          </div>
          <Field label="Year established">
            <TextInput
              type="number"
              value={form.yearEstablished}
              onChange={(e) => onChange('yearEstablished', e.target.value)}
              placeholder="1995"
            />
          </Field>
          <Field label="Principal name">
            <TextInput
              value={form.principalName}
              onChange={(e) => onChange('principalName', e.target.value)}
              placeholder="Principal name"
            />
          </Field>
          <Field label="Chairman / correspondent name">
            <TextInput
              value={form.chairmanName}
              onChange={(e) => onChange('chairmanName', e.target.value)}
              placeholder="Chairman name"
            />
          </Field>
          <Field label="School tagline" className="sm:col-span-2">
            <TextInput
              value={form.tagline}
              onChange={(e) => onChange('tagline', e.target.value)}
              placeholder="Excellence in sports & academics"
            />
          </Field>
          <Field label="School website">
            <TextInput
              value={form.website}
              onChange={(e) => onChange('website', e.target.value)}
              placeholder="https://www.example.com"
            />
          </Field>
          <Field label="Contact number">
            <TextInput
              value={form.contactNumber}
              onChange={(e) => onChange('contactNumber', e.target.value)}
              placeholder="+91 98765 43210"
            />
          </Field>
          <Field label="Email address" className="sm:col-span-2">
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="school@example.com"
            />
          </Field>
        </FormSection>
      )

    case 1: {
      const states = withCurrentOption(getStates(), form.state)
      const districts = withCurrentOption(
        getDistricts(form.state),
        form.district,
      )
      const cities = withCurrentOption(
        getCities(form.state, form.district),
        form.city,
      )

      return (
        <FormSection title="Location information">
          <Field label="State">
            <SelectInput
              value={form.state}
              onChange={(e) => {
                onChange('state', e.target.value)
                onChange('district', '')
                onChange('city', '')
              }}
            >
              <option value="">Select state</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="District">
            <SelectInput
              value={form.district}
              disabled={!form.state}
              onChange={(e) => {
                onChange('district', e.target.value)
                onChange('city', '')
              }}
            >
              <option value="">
                {form.state ? 'Select district' : 'Select state first'}
              </option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="City">
            <SelectInput
              value={form.city}
              disabled={!form.district}
              onChange={(e) => onChange('city', e.target.value)}
            >
              <option value="">
                {form.district ? 'Select city' : 'Select district first'}
              </option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Landmark">
            <TextInput
              value={form.landmark}
              onChange={(e) => onChange('landmark', e.target.value)}
              placeholder="Near city center"
            />
          </Field>
          <Field label="Full address" className="sm:col-span-2">
            <TextArea
              rows={3}
              value={form.fullAddress}
              onChange={(e) => onChange('fullAddress', e.target.value)}
              placeholder="Street, area, city"
            />
          </Field>
          <Field label="Pincode">
            <TextInput
              value={form.pincode}
              onChange={(e) => onChange('pincode', e.target.value)}
              placeholder="560001"
            />
          </Field>
          <Field label="Google Maps location">
            <TextInput
              value={form.googleMapsUrl}
              onChange={(e) => onChange('googleMapsUrl', e.target.value)}
              placeholder="https://maps.google.com/?q=..."
            />
          </Field>
          <Field label="Latitude">
            <TextInput
              value={form.latitude}
              onChange={(e) => onChange('latitude', e.target.value)}
              placeholder="12.9716"
            />
          </Field>
          <Field label="Longitude">
            <TextInput
              value={form.longitude}
              onChange={(e) => onChange('longitude', e.target.value)}
              placeholder="77.5946"
            />
          </Field>
        </FormSection>
      )
    }

    case 2:
      return (
        <FormSection title="Infrastructure details">
          <Field label="Campus area">
            <TextInput
              value={form.campusArea}
              onChange={(e) => onChange('campusArea', e.target.value)}
              placeholder="10 acres"
            />
          </Field>
          <Field label="Playground">
            <TextInput
              value={form.playground}
              onChange={(e) => onChange('playground', e.target.value)}
              placeholder="Outdoor sports ground"
            />
          </Field>
          <Field label="Sports facilities" className="sm:col-span-2">
            <TextInput
              value={form.sportsFacilities}
              onChange={(e) => onChange('sportsFacilities', e.target.value)}
              placeholder="Cricket pitch, Football turf, Basketball court"
            />
          </Field>
          <div className="sm:col-span-2 flex flex-wrap gap-6">
            <CheckboxField
              label="Swimming pool"
              checked={form.hasSwimmingPool}
              onChange={(checked) => onChange('hasSwimmingPool', checked)}
            />
            <CheckboxField
              label="Indoor sports arena"
              checked={form.hasIndoorSportsArena}
              onChange={(checked) => onChange('hasIndoorSportsArena', checked)}
            />
          </div>
        </FormSection>
      )

    case 3:
      return (
        <FormSection title="Faculty information">
          <Field label="Sports instructor" className="sm:col-span-2">
            <TextInput
              value={form.sportsInstructor}
              onChange={(e) => onChange('sportsInstructor', e.target.value)}
              placeholder="Coach name"
            />
          </Field>
        </FormSection>
      )

    case 4:
      return (
        <FormSection title="Student information">
          <Field label="Total students">
            <TextInput
              type="number"
              value={form.totalStudents}
              onChange={(e) => onChange('totalStudents', e.target.value)}
              placeholder="2500"
            />
          </Field>
          <Field label="Boys count">
            <TextInput
              type="number"
              value={form.boysCount}
              onChange={(e) => onChange('boysCount', e.target.value)}
              placeholder="1300"
            />
          </Field>
          <Field label="Girls count">
            <TextInput
              type="number"
              value={form.girlsCount}
              onChange={(e) => onChange('girlsCount', e.target.value)}
              placeholder="1200"
            />
          </Field>
        </FormSection>
      )

    default:
      return null
  }
}
