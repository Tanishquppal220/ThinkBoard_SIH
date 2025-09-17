import React from 'react'
import { useThemeStore } from '../lib/useTheme.js'
import { THEMES } from '../constants/index.js'
import { Home, Palette, Check, Moon, Sun, Monitor, Settings, Shield } from 'lucide-react'
import { Link } from 'react-router'

const SettingPage = () => {
  const {theme, setTheme} = useThemeStore();

  return (
    <div className='min-h-screen bg-base-100'>
      {/* Header */}
      <div className='bg-base-200/50 border-b border-base-300'>
        <div className='container mx-auto px-4 sm:px-6 py-2'>
          <div className='flex items-center justify-between'>
            {/* Left side - Home Icon */}
            <Link to='/' className='btn btn-ghost btn-circle hover:scale-110 transition-transform duration-300'>
              <Home className='w-6 h-6 text-primary' />
            </Link>

            {/* Center - Page Title */}
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center'>
                <Settings className='w-5 h-5 text-primary' />
              </div>
              <div>
                <h1 className='text-2xl sm:text-3xl font-bold text-base-content'>Settings</h1>
                <p className='text-base-content/60 text-sm hidden sm:block'>Customize your experience</p>
              </div>
            </div>

            {/* Right side - Quick Theme Suggestions Dropdown */}
            <div className="dropdown dropdown-end">
              <div 
                tabIndex={0} 
                role="button" 
                className="btn btn-ghost btn-circle hover:scale-110 transition-transform duration-300"
              >
                <Palette className='w-6 h-6 text-base-content' />
              </div>
              <ul 
                tabIndex={0} 
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow-lg border border-base-300"
              >
                <li className='menu-title text-xs font-semibold mb-1'>
                  <span>Quick Themes</span>
                </li>
                <li>
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-3 ${theme === 'light' ? 'bg-primary text-primary-content' : ''}`}
                  >
                    <Sun className='w-4 h-4' />
                    <span>Light</span>
                    {theme === 'light' && <Check className='w-4 h-4 ml-auto' />}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-3 ${theme === 'dark' ? 'bg-primary text-primary-content' : ''}`}
                  >
                    <Moon className='w-4 h-4' />
                    <span>Dark</span>
                    {theme === 'dark' && <Check className='w-4 h-4 ml-auto' />}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setTheme('synthwave')}
                    className={`flex items-center gap-3 ${theme === 'synthwave' ? 'bg-primary text-primary-content' : ''}`}
                  >
                    <Shield className='w-4 h-4' />
                    <span>Synthwave</span>
                    {theme === 'synthwave' && <Check className='w-4 h-4 ml-auto' />}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setTheme('cupcake')}
                    className={`flex items-center gap-3 ${theme === 'cupcake' ? 'bg-primary text-primary-content' : ''}`}
                  >
                    <Monitor className='w-4 h-4' />
                    <span>Cupcake</span>
                    {theme === 'cupcake' && <Check className='w-4 h-4 ml-auto' />}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selection Section */}
      <div className='container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl'>
        <div className='card bg-base-200 shadow-lg'>
          <div className='card-body p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center'>
                <Palette className='w-5 h-5 text-primary' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-base-content'>Theme Selection</h2>
                <p className='text-base-content/70 text-sm'>Choose a color theme for your interface</p>
              </div>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3'>
              {THEMES.map((t) => (
                <button
                  key={t}
                  className={`
                    group relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-md
                    ${theme === t ? "ring-2 ring-primary bg-primary/10" : "hover:bg-base-100/50"}
                  `}
                  onClick={() => setTheme(t)}
                >
                  {/* Theme preview colors */}
                  <div className='h-12 w-full relative rounded-lg overflow-hidden border border-base-300' data-theme={t}>
                    <div className='absolute inset-0 grid grid-cols-4 gap-0.5 p-1'>
                      <div className="rounded-sm bg-primary"></div>
                      <div className="rounded-sm bg-secondary"></div>
                      <div className="rounded-sm bg-accent"></div>
                      <div className="rounded-sm bg-neutral"></div>
                    </div>
                  </div>
                  
                  {/* Theme name */}
                  <span className="text-xs font-medium text-center leading-tight">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                  
                  {/* Selected indicator */}
                  {theme === t && (
                    <div className='absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center'>
                      <Check className='w-3 h-3 text-primary-content' />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingPage