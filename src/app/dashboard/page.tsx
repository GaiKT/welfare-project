import UserLayout from "@/components/layouts/UserLayout";

export default function UserDashboard() {
  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold">
            Welcome to Your Welfare Portal
          </h1>
          <p className="mt-2 text-brand-100">
            Access your welfare benefits and submit claims easily from your dashboard.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Claims</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Claimed</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">$-</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Programs</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href="/dashboard/claims/new"
              className="flex items-center p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
            >
              <div className="p-2 bg-brand-100 dark:bg-brand-900/50 rounded-lg">
                <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Submit New Claim
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Apply for welfare benefits
                </p>
              </div>
            </a>

            <a
              href="/dashboard/claims"
              className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  View My Claims
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Track claim status
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* Available welfare programs */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Welfare Programs
          </h2>
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Medical Welfare</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Medical expenses reimbursement up to $5,000 per year
              </p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Maximum: $5,000
                </span>
                <a
                  href="/dashboard/welfare/medical-welfare-id"
                  className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Learn more →
                </a>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Education Welfare</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Training and education support up to $3,000 per year
              </p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Maximum: $3,000
                </span>
                <a
                  href="/dashboard/welfare/education-welfare-id"
                  className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Learn more →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Recent claims */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Claims
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            Your recent claims will appear here
          </p>
        </div>
      </div>
    </UserLayout>
  );
}