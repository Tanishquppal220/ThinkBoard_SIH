import React from 'react'
import { ZapIcon } from 'lucide-react'

const RateLimitedUI = () => {
  return (
    
    <div className='mx-auto max-w-6xl bg-base-300 p-10 h-40 border-white my-10 rounded-lg flex items-center justify-center gap-7'>
      <div>
        <ZapIcon className='size-10 text-primary'/>
      </div>
      <div>
        <p className=' text-emerald-100 text-bold text-xl'>There are too many users than the website can handle. Try again in sometime for better experience.</p>
      </div>
    </div>
  )
}

export default RateLimitedUI
