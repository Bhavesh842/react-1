import { useState, useCallback, useEffect, useRef } from 'react'

function App() {
  const passRef = useRef()
  const [length, setLength] = useState(8)
  const [noallow, setNoAllow] = useState(false)
  const [charallow, setcharallow] = useState(false)
  const [pass, setPass] = useState("")

  const passgenrator = useCallback(() => {
    let pass = ""
    let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (noallow) {
      chars += "0123456789"
    }
    if (charallow) {
      chars += "!@#$%^&*()_+"
    }

    for (let i = 0; i < length; i++) {
      let char = Math.floor(Math.random() * chars.length)
      pass += chars.charAt(char)
    }
    setPass(pass)
  }, [length, noallow, charallow])

  const copytociplyboard = useCallback(() => {
    passRef.current?.select()
    passRef.current?.setSelectionRange(0, 9999)
    window.navigator.clipboard.writeText(pass)
  }, [pass])

  useEffect(() => {
    passgenrator()
  }, [length, noallow, charallow])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">Password Generator</h1>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={pass}
            readOnly
            placeholder="Your Password"
            ref={passRef}
            className="flex-1 px-3 py-2 border rounded-l-md bg-gray-50 text-gray-800"
          />
          <button
            onClick={copytociplyboard}
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition"
          >
            Copy
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Length: {length}</label>
          <input
            type="range"
            min="8"
            max="50"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={noallow}
              onChange={() => setNoAllow((prev) => !prev)}
              className="accent-blue-500"
            />
            Include Numbers
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={charallow}
              onChange={() => setcharallow((prev) => !prev)}
              className="accent-blue-500"
            />
            Include Special Characters
          </label>
        </div>
      </div>
    </div>
  )
}

export default App