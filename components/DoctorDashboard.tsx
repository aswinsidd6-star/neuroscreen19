/**
 * DOCTOR DASHBOARD COMPONENT (PHASE 8 - UI/UX PROFESSIONALIZATION)
 * Professional clinician dashboard for patient management and assessment review
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Patient, ClinicalReport } from '@/types'
import Logger from '@/utils/logger'

interface DashboardProps {
  doctorId: string
  doctorName: string
  specialty?: string
}

interface PatientWithResults extends Patient {
  lastAssessment?: string
  lastScore?: number
  riskLevel?: string
  resultsCount: number
}

/**
 * Doctor Dashboard Component
 * Displays patient list, recent assessments, and quick actions
 */
export const DoctorDashboard: React.FC<DashboardProps> = ({
  doctorId,
  doctorName,
  specialty = 'General Practice',
}) => {
  const [patients, setPatients] = useState<PatientWithResults[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)
  const [showNewPatient, setShowNewPatient] = useState(false)

  useEffect(() => {
    loadPatients()
  }, [doctorId])

  const loadPatients = async () => {
    try {
      Logger.info('DoctorDashboard: Loading patients', { doctorId })
      setLoading(true)

      // In production, replace with actual API call
      // const response = await fetch(`/api/doctor/${doctorId}/patients`)
      // const data = await response.json()
      // setPatients(data)

      // Mock data for demonstration
      setPatients([
        {
          id: '1',
          name: 'John Smith',
          age: 72,
          gender: 'M',
          lastAssessment: '2024-01-15',
          lastScore: 26,
          riskLevel: 'low',
          resultsCount: 3,
          createdAt: '2023-06-01',
        },
        {
          id: '2',
          name: 'Mary Johnson',
          age: 68,
          gender: 'F',
          lastAssessment: '2024-01-18',
          lastScore: 18,
          riskLevel: 'moderate',
          resultsCount: 5,
          createdAt: '2023-04-15',
        },
        {
          id: '3',
          name: 'Robert Williams',
          age: 82,
          gender: 'M',
          lastAssessment: '2024-01-20',
          lastScore: 12,
          riskLevel: 'high',
          resultsCount: 7,
          createdAt: '2023-02-01',
        },
      ])

      Logger.info('DoctorDashboard: Patients loaded', { count: 3 })
    } catch (error) {
      Logger.error('DoctorDashboard: Failed to load patients', { error, doctorId })
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.includes(searchTerm)

    const matchesRisk = filterRisk === 'all' || p.riskLevel === filterRisk

    return matchesSearch && matchesRisk
  })

  const getRiskColor = (risk?: string) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'mild_impairment':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'moderate':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getRiskBadge = (risk?: string) => {
    const colors = getRiskColor(risk)
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${colors}`}>
        {risk?.toUpperCase().replace(/_/g, ' ') || 'UNKNOWN'}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome, {doctorName} • {specialty}
              </p>
            </div>
            <button
              onClick={() => setShowNewPatient(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + New Patient
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Patients"
            value={patients.length.toString()}
            icon="👥"
          />
          <StatCard
            label="Recent Assessments"
            value={(patients.length * 3.4).toFixed(0)}
            icon="📋"
          />
          <StatCard
            label="High Risk Patients"
            value={patients.filter((p) => p.riskLevel === 'high').length.toString()}
            icon="⚠️"
          />
          <StatCard
            label="Follow-ups Pending"
            value="8"
            icon="📌"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Patients
              </label>
              <input
                type="text"
                placeholder="Name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Level
              </label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="low">Low Risk</option>
                <option value="mild_impairment">Mild Impairment</option>
                <option value="moderate">Moderate</option>
                <option value="high">High Risk</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterRisk('all')
                }}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Patients List */}
        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">No patients found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                isSelected={selectedPatient === patient.id}
                onSelect={() => setSelectedPatient(patient.id)}
                riskColor={getRiskColor(patient.riskLevel)}
                riskBadge={getRiskBadge(patient.riskLevel)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Patient Modal */}
      {showNewPatient && (
        <NewPatientModal
          onClose={() => setShowNewPatient(false)}
          onSuccess={() => {
            setShowNewPatient(false)
            loadPatients()
          }}
        />
      )}
    </div>
  )
}

/**
 * Stat Card Component
 */
const StatCard: React.FC<{
  label: string
  value: string
  icon: string
}> = ({ label, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <span className="text-4xl">{icon}</span>
    </div>
  </div>
)

/**
 * Patient Card Component
 */
const PatientCard: React.FC<{
  patient: PatientWithResults
  isSelected: boolean
  onSelect: () => void
  riskColor: string
  riskBadge: React.ReactNode
}> = ({ patient, isSelected, onSelect, riskColor, riskBadge }) => (
  <div
    onClick={onSelect}
    className={`bg-white p-6 rounded-lg shadow cursor-pointer transition hover:shadow-lg ${
      isSelected ? 'ring-2 ring-blue-500' : ''
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900">{patient.name}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Age {patient.age} • {patient.gender === 'M' ? 'Male' : 'Female'} • ID: {patient.id}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Last Assessment</p>
            <p className="font-semibold text-gray-900">
              {patient.lastAssessment
                ? new Date(patient.lastAssessment).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Last Score</p>
            <p className="font-semibold text-gray-900">
              {patient.lastScore ? `${patient.lastScore}/30` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Assessments</p>
            <p className="font-semibold text-gray-900">{patient.resultsCount}</p>
          </div>
        </div>
      </div>

      <div className="text-right ml-4">
        {riskBadge}
        <div className="mt-4 space-y-2">
          <button className="block w-full bg-blue-600 text-white px-3 py-2 text-sm rounded hover:bg-blue-700 transition">
            View Results
          </button>
          <button className="block w-full bg-gray-200 text-gray-800 px-3 py-2 text-sm rounded hover:bg-gray-300 transition">
            New Assessment
          </button>
        </div>
      </div>
    </div>
  </div>
)

/**
 * New Patient Modal
 */
const NewPatientModal: React.FC<{
  onClose: () => void
  onSuccess: () => void
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'M',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    Logger.info('NewPatientModal: Creating patient', { formData })

    try {
      // In production, call API to create patient
      // const response = await fetch('/api/patients', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })

      // For now, just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onSuccess()
    } catch (error) {
      Logger.error('NewPatientModal: Failed to create patient', { error })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="bg-blue-600 text-white p-6">
          <h2 className="text-2xl font-bold">Add New Patient</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DoctorDashboard
