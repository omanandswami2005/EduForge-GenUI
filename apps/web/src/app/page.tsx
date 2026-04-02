import Link from "next/link";

export default function HomePage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
            <div className="text-center max-w-2xl mx-auto px-4">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                    Edu<span className="text-blue-600">Forge</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    AI-Powered Adaptive Learning with Generative UI
                </p>
                <p className="text-gray-500 mb-12 leading-relaxed">
                    Upload a lecture → AI generates adaptive assessments → Each student
                    gets a unique, real-time interface powered by their personal knowledge
                    state.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/login"
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Get Started
                    </Link>
                    <Link
                        href="/register"
                        className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Create Account
                    </Link>
                </div>
            </div>
        </main>
    );
}
