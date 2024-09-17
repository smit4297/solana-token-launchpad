import  { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm, Controller } from 'react-hook-form'
import { Upload, ChevronDown, ChevronUp } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { useCreateToken } from '@/actions/tokencreator'
import { storage} from '../firebase-config'




export type FormData = {
  tokenName: string
  tokenSymbol: string
  decimals: number
  supply: number
  description: string
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
}

export default function TokenCreatorForm() {
  const [showSocialLinks, setShowSocialLinks] = useState(false)
  const [revokeUpdate, setRevokeUpdate] = useState(false)
  const [revokeFreeze, setRevokeFreeze] = useState(false)
  const [revokeMint, setRevokeMint] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [loading, setLoading] = useState<String| null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      decimals: 9,
    }
  })

  const createToken = useCreateToken()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      uploadImage(file)
    }
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const uploadImage = (file: File) => {
    const storageRef = ref(storage, 'token_images/' + file.name)
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on('state_changed',
      (snapshot : any) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        setUploadProgress(progress)
      },
      (error : any) => {
        setUploadError('Error uploading image: ' + error.message)
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL : any) => {
          setUploadedImageUrl(downloadURL)
          setUploadProgress(0)
        })
      }
    )
  }

  const calculateTotalFees = () => {
    let total = 0.1 // Base fee
    if (revokeUpdate) total += 0.05
    if (revokeFreeze) total += 0.05
    if (revokeMint) total += 0.05
    return total.toFixed(2)
  }

  const onSubmit = async (data: FormData) => {
    try {
      setLoading("Creating token, please wait...");
      
      // Await the token creation process
      const token = await createToken(data, uploadedImageUrl, revokeUpdate, revokeFreeze, revokeMint);
      
      if (token != null) {
        setLoading("Token created successfully!");
      } else {
        setLoading("Token creation failed. Please try again.");
      }
    } catch (error) {
      console.error("Token creation error: ", error);
      setLoading("Error creating token. Please try again.");
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Solana Token Creator</h1>
          <p className="text-gray-400">Create your own Solana token with custom properties and authorities</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tokenName" className="block text-sm font-medium mb-1">Token Name</label>
              <Controller
                name="tokenName"
                control={control}
                rules={{ required: 'Token name is required' }}
                render={({ field } : any) => (
                  <input
                    {...field}
                    type="text"
                    id="tokenName"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Awesome Token"
                  />
                )}
              />
              {errors.tokenName && <p className="mt-1 text-sm text-red-500">{errors.tokenName.message}</p>}
            </div>
            <div>
              <label htmlFor="tokenSymbol" className="block text-sm font-medium mb-1">Token Symbol</label>
              <Controller
                name="tokenSymbol"
                control={control}
                rules={{ required: 'Token symbol is required' }}
                render={({ field } : any) => (
                  <input
                    {...field}
                    type="text"
                    id="tokenSymbol"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="MAT"
                  />
                )}
              />
              {errors.tokenSymbol && <p className="mt-1 text-sm text-red-500">{errors.tokenSymbol.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="decimals" className="block text-sm font-medium mb-1">
                Decimals
                
              </label>
              <Controller
                name="decimals"
                control={control}
                rules={{ required: 'Decimals are required', min: 0, max: 9 }}
                render={({ field } : any) => (
                  <input
                    {...field}
                    type="number"
                    id="decimals"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              />
              {errors.decimals && <p className="mt-1 text-sm text-red-500">{errors.decimals.message}</p>}
            </div>
            <div>
              <label htmlFor="supply" className="block text-sm font-medium mb-1">Supply</label>
              <Controller
                name="supply"
                control={control}
                rules={{ required: 'Supply is required', min: 1 }}
                render={({ field } : any) => (
                  <input
                    {...field}
                    type="number"
                    id="supply"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1000000"
                  />
                )}
              />
              {errors.supply && <p className="mt-1 text-sm text-red-500">{errors.supply.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field } : any) => (
                <textarea
                  {...field}
                  id="description"
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your token..."
                />
              )}
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div className="border border-gray-700 rounded-md p-4">
            <div {...getRootProps()} className="flex flex-col items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadedImageUrl ? (
                    <img src={uploadedImageUrl} alt="Uploaded token" className="w-20 h-20 object-cover rounded-full" />
                  ) : (
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  )}
                  <p className="mb-2 text-sm text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
                </div>
                <input {...getInputProps()} />
              </label>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2">
                <div className="bg-gray-600 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            {uploadError && <p className="mt-2 text-sm text-red-500">{uploadError}</p>}
          </div>

          <div>
            <button
              type="button"
              className="flex items-center justify-between w-full px-4 py-2 text-left text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
              onClick={() => setShowSocialLinks(!showSocialLinks)}
            >
              <span>Add Social Links</span>
              {showSocialLinks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {showSocialLinks && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="website"
                  control={control}
                  render={({ field } : any ) => (
                    <input
                      {...field}
                      type="url"
                      placeholder="Website"
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
                <Controller
                  name="twitter"
                  control={control}
                  render={({ field } :any) => (
                    <input
                      {...field}
                      type="url"
                      placeholder="Twitter"
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
                <Controller
                  name="telegram"
                  control={control}
                  render={({ field } : any) => (
                    <input
                      {...field}
                      type="url"
                      placeholder="Telegram"
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
                <Controller
                  name="discord"
                  control={control}
                  render={({ field } : any) => (
                    <input
                      {...field}
                      type="url"
                      placeholder="Discord"
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Revoke Authorities</h3>
            <ToggleSwitch
              label="Revoke Update (Immutable)"
              description="Token will be immutable after creation"
              fee={0.05}
              checked={revokeUpdate}
              onChange={() => setRevokeUpdate(!revokeUpdate)}
            />
            <ToggleSwitch
              label="Revoke Freeze"
              description="Token accounts can't be frozen"
              fee={0.05}
              checked={revokeFreeze}
              onChange={() => setRevokeFreeze(!revokeFreeze)}
            />
            <ToggleSwitch
              label="Revoke Mint"
              description="No more tokens can be minted"
              fee={0.05}
              checked={revokeMint}
              onChange={() => setRevokeMint(!revokeMint)}
            />
          </div>
              <p>{loading}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Total Fees:</span>
            <span className="text-xl font-bold">{calculateTotalFees()} SOL</span>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            Create Token
          </button>
        </form>
      </div>
    </div>
  )
}


function ToggleSwitch({ label, description, fee, checked, onChange }: { label: string; description: string; fee: number; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-sm font-medium">{label}</h4>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <div className="flex items-center">
        <span className="mr-3 text-sm text-gray-400">{fee} SOL</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  )
}