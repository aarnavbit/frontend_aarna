/** Private dashboard route with no public applicant data rendered before authentication. */

import { ReviewerDashboard } from '../components/ReviewerDashboard'

export function DashboardPage() {
  return (
    <section className="dashboard-page section-wrap">
      <ReviewerDashboard />
    </section>
  )
}
