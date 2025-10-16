import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Book, 
  Target, 
  Lightbulb, 
  TrendingUp, 
  Package, 
  Wrench, 
  Tag, 
  Shield,
  Upload,
  Database,
  DollarSign,
  Users,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Home
} from '../components/Icons'

export default function ResourcesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('platform')

  const tabs = [
    { id: 'platform', label: 'Platform Guide', icon: Book },
    { id: 'concepts', label: 'Data Concepts', icon: Database },
    { id: 'curation', label: 'Raw vs Curated', icon: Target },
    { id: 'tips', label: 'Success Tips', icon: Lightbulb }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white border-b-4 border-black shadow-[0_4px_0_#000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-extrabold text-xl hover:text-cyan-600 transition"
          >
            <Home className="h-6 w-6" />
            <span className="hidden sm:inline">SETIQUE</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold">📚 Resources & Guides</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white border-4 border-black rounded-xl shadow-[8px_8px_0_#000] mb-8 overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-4 font-extrabold transition-all flex flex-col items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-yellow-300 to-pink-300'
                      : 'bg-white hover:bg-gray-50'
                  } ${index < tabs.length - 1 ? 'border-r-4 border-black' : ''} ${
                    index < 2 ? 'border-b-4 lg:border-b-0 border-black' : ''
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white border-4 border-black rounded-xl shadow-[8px_8px_0_#000] p-6 sm:p-8">
          {/* Platform Guide Tab */}
          {activeTab === 'platform' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold mb-4 flex items-center gap-3">
                  <Book className="h-8 w-8 text-cyan-600" />
                  Getting Started with SETIQUE
                </h2>
                <p className="text-lg font-semibold text-black/70">
                  Your complete guide to buying, selling, and curating datasets on a marketplace built for AI creators and data experts.
                </p>
              </div>

              {/* Quick Start */}
              <div className="bg-gradient-to-r from-cyan-100 to-blue-100 border-3 border-cyan-600 rounded-xl p-6">
                <h3 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Quick Start (5 Minutes)
                </h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-cyan-600 text-white font-extrabold rounded-full flex items-center justify-center border-2 border-black">1</span>
                    <div>
                      <p className="font-bold">Create Your Account</p>
                      <p className="text-sm text-black/70">Sign up with email or GitHub. Verify your email to get started.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-cyan-600 text-white font-extrabold rounded-full flex items-center justify-center border-2 border-black">2</span>
                    <div>
                      <p className="font-bold">Browse the Marketplace</p>
                      <p className="text-sm text-black/70">Explore datasets by category, curation level, or search for specific topics.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-cyan-600 text-white font-extrabold rounded-full flex items-center justify-center border-2 border-black">3</span>
                    <div>
                      <p className="font-bold">Make Your First Purchase or Upload</p>
                      <p className="text-sm text-black/70">Buy datasets instantly with Stripe, or upload your own to start selling.</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Platform Features */}
              <div>
                <h3 className="text-2xl font-extrabold mb-4">🎯 Platform Features</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-yellow-100 border-3 border-yellow-400 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <Upload className="h-6 w-6 text-yellow-700 flex-shrink-0" />
                      <div>
                        <h4 className="font-extrabold">Upload & Sell</h4>
                        <p className="text-sm text-black/70">List datasets at any price. Keep 80% of revenue (Stripe fees apply).</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-100 border-3 border-green-400 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <Database className="h-6 w-6 text-green-700 flex-shrink-0" />
                      <div>
                        <h4 className="font-extrabold">Instant Purchase</h4>
                        <p className="text-sm text-black/70">Buy datasets with credit card. Download immediately after payment.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-pink-100 border-3 border-pink-400 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <DollarSign className="h-6 w-6 text-pink-700 flex-shrink-0" />
                      <div>
                        <h4 className="font-extrabold">Bounties (Curation Requests)</h4>
                        <p className="text-sm text-black/70">Request specific datasets. Pro Curators bid to fulfill your needs.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-100 border-3 border-purple-400 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <Shield className="h-6 w-6 text-purple-700 flex-shrink-0" />
                      <div>
                        <h4 className="font-extrabold">Pro Curator Program</h4>
                        <p className="text-sm text-black/70">Build reputation, earn trust level, access exclusive opportunities.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Roles */}
              <div>
                <h3 className="text-2xl font-extrabold mb-4">👥 User Roles</h3>
                <div className="space-y-4">
                  <div className="border-3 border-black rounded-xl p-4 bg-gradient-to-r from-cyan-50 to-blue-50">
                    <h4 className="font-extrabold mb-2 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Data Buyers
                    </h4>
                    <p className="text-sm text-black/70">Browse marketplace, purchase datasets, request custom curation via bounties.</p>
                  </div>

                  <div className="border-3 border-black rounded-xl p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                    <h4 className="font-extrabold mb-2 flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Data Sellers
                    </h4>
                    <p className="text-sm text-black/70">Upload datasets (raw/partial/curated), set prices, earn revenue from sales.</p>
                  </div>

                  <div className="border-3 border-black rounded-xl p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                    <h4 className="font-extrabold mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Pro Curators (Trust Level 3+)
                    </h4>
                    <p className="text-sm text-black/70">Verified experts who fulfill bounties, upgrade raw datasets, and earn premium rates.</p>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-pink-100 to-yellow-100 border-3 border-black rounded-xl p-6 text-center">
                <h3 className="text-2xl font-extrabold mb-3">Ready to Get Started?</h3>
                <p className="font-semibold text-black/70 mb-4">
                  Join SETIQUE today and start buying, selling, or curating datasets.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link
                    to="/datasets"
                    className="px-6 py-3 bg-cyan-400 text-black font-extrabold rounded-full border-2 border-black hover:bg-cyan-500 shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all"
                  >
                    Browse Marketplace
                  </Link>
                  {!user && (
                    <button
                      onClick={() => navigate('/datasets')}
                      className="px-6 py-3 bg-pink-400 text-black font-extrabold rounded-full border-2 border-black hover:bg-pink-500 shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all"
                    >
                      Sign Up Free
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data Concepts Tab */}
          {activeTab === 'concepts' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold mb-4 flex items-center gap-3">
                  <Database className="h-8 w-8 text-blue-600" />
                  Understanding Data & Datasets
                </h2>
                <p className="text-lg font-semibold text-black/70">
                  Essential concepts for working with AI/ML datasets.
                </p>
              </div>

              {/* What is a Dataset */}
              <div className="bg-blue-50 border-3 border-blue-400 rounded-xl p-6">
                <h3 className="text-2xl font-extrabold mb-3">📚 What is a Dataset?</h3>
                <p className="text-black/80 mb-4 font-semibold">
                  A dataset is a structured collection of data used to train AI models. It typically consists of:
                </p>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold"><strong>Raw Files:</strong> Images, audio, video, or text documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold"><strong>Labels/Annotations:</strong> Tags, categories, or metadata describing the data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold"><strong>Documentation:</strong> README files explaining structure and usage</span>
                  </li>
                </ul>
              </div>

              {/* Data Modalities */}
              <div>
                <h3 className="text-2xl font-extrabold mb-4">🎨 Data Modalities</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="border-3 border-black rounded-xl p-4 bg-pink-50">
                    <h4 className="font-extrabold mb-2">👁️ Vision</h4>
                    <p className="text-sm text-black/70">Images for object detection, classification, segmentation (JPEG, PNG, TIFF)</p>
                  </div>

                  <div className="border-3 border-black rounded-xl p-4 bg-cyan-50">
                    <h4 className="font-extrabold mb-2">🔊 Audio</h4>
                    <p className="text-sm text-black/70">Sound files for speech recognition, music analysis (WAV, MP3, FLAC)</p>
                  </div>

                  <div className="border-3 border-black rounded-xl p-4 bg-yellow-50">
                    <h4 className="font-extrabold mb-2">📝 Text/NLP</h4>
                    <p className="text-sm text-black/70">Documents, articles, conversations for language models (TXT, JSON, CSV)</p>
                  </div>

                  <div className="border-3 border-black rounded-xl p-4 bg-purple-50">
                    <h4 className="font-extrabold mb-2">🎬 Video</h4>
                    <p className="text-sm text-black/70">Video clips for action recognition, tracking (MP4, AVI, MOV)</p>
                  </div>
                </div>
              </div>

              {/* File Formats */}
              <div>
                <h3 className="text-2xl font-extrabold mb-4">📁 Common File Formats</h3>
                <div className="bg-gray-50 border-3 border-gray-400 rounded-xl p-6">
                  <div className="grid sm:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-extrabold mb-2">Images</h4>
                      <ul className="text-sm space-y-1 text-black/70 font-semibold">
                        <li>• JPEG/JPG (lossy)</li>
                        <li>• PNG (lossless)</li>
                        <li>• TIFF (high quality)</li>
                        <li>• WebP (modern)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-extrabold mb-2">Structured Data</h4>
                      <ul className="text-sm space-y-1 text-black/70 font-semibold">
                        <li>• CSV (tables)</li>
                        <li>• JSON (nested data)</li>
                        <li>• Parquet (big data)</li>
                        <li>• HDF5 (scientific)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-extrabold mb-2">Archives</h4>
                      <ul className="text-sm space-y-1 text-black/70 font-semibold">
                        <li>• ZIP (universal)</li>
                        <li>• TAR.GZ (Linux)</li>
                        <li>• 7Z (high compression)</li>
                        <li>• RAR (legacy)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Quality */}
              <div className="bg-green-50 border-3 border-green-400 rounded-xl p-6">
                <h3 className="text-2xl font-extrabold mb-3">⭐ What Makes Quality Data?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5 fill-current" />
                    <div>
                      <p className="font-bold">Accuracy</p>
                      <p className="text-sm text-black/70">Labels match the actual content correctly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5 fill-current" />
                    <div>
                      <p className="font-bold">Completeness</p>
                      <p className="text-sm text-black/70">All files have required metadata and documentation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5 fill-current" />
                    <div>
                      <p className="font-bold">Consistency</p>
                      <p className="text-sm text-black/70">Uniform formatting, naming conventions, and structure</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5 fill-current" />
                    <div>
                      <p className="font-bold">Relevance</p>
                      <p className="text-sm text-black/70">Data matches the described use case and domain</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raw vs Curated Tab */}
          {activeTab === 'curation' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold mb-4 flex items-center gap-3">
                  <Target className="h-8 w-8 text-purple-600" />
                  Curation Levels Explained
                </h2>
                <p className="text-lg font-semibold text-black/70">
                  Understanding the difference between raw, partial, and curated datasets.
                </p>
              </div>

              {/* Comparison Table */}
              <div className="bg-white border-4 border-black rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-yellow-200 to-pink-200">
                      <th className="p-4 text-left font-extrabold border-b-2 border-r-2 border-black">Feature</th>
                      <th className="p-4 text-center font-extrabold border-b-2 border-r-2 border-black">
                        <div className="flex items-center justify-center gap-2">
                          <Package className="h-5 w-5" />
                          Raw
                        </div>
                      </th>
                      <th className="p-4 text-center font-extrabold border-b-2 border-r-2 border-black">
                        <div className="flex items-center justify-center gap-2">
                          <Wrench className="h-5 w-5" />
                          Partial
                        </div>
                      </th>
                      <th className="p-4 text-center font-extrabold border-b-2 border-black">
                        <div className="flex items-center justify-center gap-2">
                          <Tag className="h-5 w-5" />
                          Curated
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b-2 border-black">
                      <td className="p-3 font-bold border-r-2 border-black">Labels/Metadata</td>
                      <td className="p-3 text-center border-r-2 border-black bg-orange-50">0-10%</td>
                      <td className="p-3 text-center border-r-2 border-black bg-yellow-50">20-80%</td>
                      <td className="p-3 text-center bg-green-50">90-100%</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-3 font-bold border-r-2 border-black">Sample Previews</td>
                      <td className="p-3 text-center border-r-2 border-black bg-orange-50">Required (3-10)</td>
                      <td className="p-3 text-center border-r-2 border-black bg-yellow-50">Required (3-10)</td>
                      <td className="p-3 text-center bg-green-50">Optional</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-3 font-bold border-r-2 border-black">Documentation</td>
                      <td className="p-3 text-center border-r-2 border-black bg-orange-50">README required</td>
                      <td className="p-3 text-center border-r-2 border-black bg-yellow-50">Recommended</td>
                      <td className="p-3 text-center bg-green-50">Full docs</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-3 font-bold border-r-2 border-black">Typical Price</td>
                      <td className="p-3 text-center border-r-2 border-black bg-orange-50">$5-25</td>
                      <td className="p-3 text-center border-r-2 border-black bg-yellow-50">$20-60</td>
                      <td className="p-3 text-center bg-green-50">$50-500+</td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td className="p-3 font-bold border-r-2 border-black">Admin Review</td>
                      <td className="p-3 text-center border-r-2 border-black bg-orange-50">
                        <span className="text-xs font-bold">Yes (non-Pro)</span>
                      </td>
                      <td className="p-3 text-center border-r-2 border-black bg-yellow-50">
                        <span className="text-xs font-bold">Auto-approved</span>
                      </td>
                      <td className="p-3 text-center bg-green-50">
                        <span className="text-xs font-bold">Auto-approved</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold border-r-2 border-black">Best For</td>
                      <td className="p-3 text-center border-r-2 border-black bg-orange-50 text-xs">
                        Quick sales, upgrade opportunities
                      </td>
                      <td className="p-3 text-center border-r-2 border-black bg-yellow-50 text-xs">
                        Mid-tier pricing, some value-add
                      </td>
                      <td className="p-3 text-center bg-green-50 text-xs">
                        Premium pricing, ready-to-use
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Detailed Explanations */}
              <div className="space-y-6">
                <div className="bg-orange-50 border-3 border-orange-400 rounded-xl p-6">
                  <h3 className="text-xl font-extrabold mb-3 flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    📦 Raw Data
                  </h3>
                  <p className="text-black/80 mb-3 font-semibold">
                    Unprocessed files collected directly from sources. Minimal or no labels.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold"><strong>Pros:</strong> Cheapest to produce, fast to upload, buyers can label it themselves</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold"><strong>Cons:</strong> Requires buyer effort, lower price point, needs admin review</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold"><strong>Upgrade Path:</strong> Pro Curators can label your raw data and split revenue</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-3 border-yellow-400 rounded-xl p-6">
                  <h3 className="text-xl font-extrabold mb-3 flex items-center gap-2">
                    <Wrench className="h-6 w-6" />
                    🔧 Partial Curation
                  </h3>
                  <p className="text-black/80 mb-3 font-semibold">
                    Some files have labels or metadata. Work-in-progress datasets.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold"><strong>Pros:</strong> Mid-tier pricing, shows effort, immediate value for some use cases</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold"><strong>Cons:</strong> Not fully ready, may need buyer post-processing</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold"><strong>Use Case:</strong> Selling while still labeling, transparent about completeness</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border-3 border-green-400 rounded-xl p-6">
                  <h3 className="text-xl font-extrabold mb-3 flex items-center gap-2">
                    <Tag className="h-6 w-6" />
                    🏷️ Fully Curated
                  </h3>
                  <p className="text-black/80 mb-3 font-semibold">
                    Production-ready datasets with complete labels, clean formatting, and documentation.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold"><strong>Pros:</strong> Premium pricing, ready-to-train, professional quality</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold"><strong>Cons:</strong> Time-intensive to produce, requires expertise</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Star className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5 fill-current" />
                      <p className="text-sm font-semibold"><strong>Pro Curator Opportunity:</strong> Earn verified badge and trust level</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upgrade Partnership Info */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-3 border-purple-600 rounded-xl p-6">
                <h3 className="text-xl font-extrabold mb-3 flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  💎 Dataset Upgrade Partnerships
                </h3>
                <p className="text-black/80 mb-4 font-semibold">
                  Raw data owners can partner with Pro Curators to upgrade their datasets:
                </p>
                <ol className="space-y-2 ml-6">
                  <li className="font-semibold">1. Upload raw data (admin approves within 24-48 hours)</li>
                  <li className="font-semibold">2. Pro Curator offers to label/clean your data</li>
                  <li className="font-semibold">3. Negotiate revenue split (typical: 60/40 or 50/50)</li>
                  <li className="font-semibold">4. Curator upgrades dataset to &quot;Curated&quot; status</li>
                  <li className="font-semibold">5. Sell at 3-10x higher price, both parties earn more</li>
                </ol>
              </div>
            </div>
          )}

          {/* Success Tips Tab */}
          {activeTab === 'tips' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold mb-4 flex items-center gap-3">
                  <Lightbulb className="h-8 w-8 text-yellow-600" />
                  Tips for Success
                </h2>
                <p className="text-lg font-semibold text-black/70">
                  Best practices for buyers, sellers, and Pro Curators.
                </p>
              </div>

              {/* For Data Sellers */}
              <div className="bg-yellow-50 border-3 border-yellow-400 rounded-xl p-6">
                <h3 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
                  <Upload className="h-6 w-6" />
                  📤 For Data Sellers
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Write Clear Descriptions</p>
                      <p className="text-sm text-black/70">Explain what&apos;s included, file formats, size, and ideal use cases</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Use Sample Previews</p>
                      <p className="text-sm text-black/70">Show 5-10 representative examples so buyers know exactly what they&apos;re getting</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Price Competitively</p>
                      <p className="text-sm text-black/70">Raw: $5-25, Partial: $20-60, Curated: $50-500+ (research similar datasets)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Tag Thoroughly</p>
                      <p className="text-sm text-black/70">Use 5-10 relevant tags (modality, domain, file type) for better discoverability</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Respond to Comments</p>
                      <p className="text-sm text-black/70">Answer buyer questions quickly to build trust and close sales</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* For Data Buyers */}
              <div className="bg-cyan-50 border-3 border-cyan-400 rounded-xl p-6">
                <h3 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
                  <Database className="h-6 w-6" />
                  🛒 For Data Buyers
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Check Sample Previews First</p>
                      <p className="text-sm text-black/70">Always review samples to verify quality before purchasing</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Read Reviews & Comments</p>
                      <p className="text-sm text-black/70">See what other buyers say about dataset quality and seller responsiveness</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Ask Questions Before Buying</p>
                      <p className="text-sm text-black/70">Use comments to clarify format, size, licensing before committing</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Consider Raw Data + Bounties</p>
                      <p className="text-sm text-black/70">Buy cheap raw data, then request Pro Curator labeling via bounty</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Leave Reviews</p>
                      <p className="text-sm text-black/70">Help the community by rating datasets honestly after use</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* For Pro Curators */}
              <div className="bg-purple-50 border-3 border-purple-400 rounded-xl p-6">
                <h3 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  💎 For Pro Curators
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Build Your Reputation</p>
                      <p className="text-sm text-black/70">Complete bounties on time, upload quality curated datasets to increase trust level</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Specialize in a Domain</p>
                      <p className="text-sm text-black/70">Become known for medical imaging, NLP, audio, etc. to attract repeat clients</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Offer Dataset Upgrade Partnerships</p>
                      <p className="text-sm text-black/70">Find raw datasets, propose labeling deal (60/40 split), earn passive income</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Document Your Process</p>
                      <p className="text-sm text-black/70">Include labeling guidelines, quality checks in README to justify premium prices</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Bid Competitively on Bounties</p>
                      <p className="text-sm text-black/70">Balance pricing with timeline—fast + quality wins contracts</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Mistakes */}
              <div className="bg-red-50 border-3 border-red-400 rounded-xl p-6">
                <h3 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6" />
                  ❌ Common Mistakes to Avoid
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Overpricing Raw Data</p>
                      <p className="text-sm text-black/70">Unlabeled data should be $5-25, not $100+. Be realistic about effort required.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">No Sample Previews</p>
                      <p className="text-sm text-black/70">Buyers won&apos;t purchase blind. Always show representative examples.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Vague Descriptions</p>
                      <p className="text-sm text-black/70">&quot;Good dataset&quot; doesn&apos;t sell. Specify: 10,000 images, 224x224, JPEG, labeled into 50 categories.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Ignoring Licensing</p>
                      <p className="text-sm text-black/70">Clearly state usage rights. Commercial use? Attribution required? Be explicit.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Uploading Low Quality</p>
                      <p className="text-sm text-black/70">Blurry images, corrupted files, inconsistent formatting hurt your reputation.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final CTA */}
              <div className="bg-gradient-to-r from-cyan-100 to-pink-100 border-3 border-black rounded-xl p-6 text-center">
                <h3 className="text-2xl font-extrabold mb-3">💪 Ready to Succeed?</h3>
                <p className="font-semibold text-black/70 mb-4">
                  Apply these tips and start building your reputation on SETIQUE.
                </p>
                <Link
                  to="/datasets"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-400 to-pink-400 text-black font-extrabold rounded-full border-2 border-black hover:opacity-90 shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all"
                >
                  Start Exploring Datasets →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
