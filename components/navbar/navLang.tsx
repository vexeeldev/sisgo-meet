import { useSettings } from '@/hooks/useSettings'
import { Icon } from '@/components/icon'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const FlagsID = () => {
  return (
    <>
      <Icon icon={'flagpack:id'} size={18} className='my-auto' />
    </>
  )
}

const FlagsEN = () => {
  return (
    <>
      <Icon icon={'flagpack:us'} size={18} className='my-auto' />
    </>
  )
}

interface Props {
  dark?: boolean
  variant?: 'dropdown' | 'bullet'
}

const NavLanguage = (props: Props) => {
  const [openMenu, setOpenMenu] = useState(false)
  const { settings, saveSettings } = useSettings()

  const selectedLang = (settings.lang || 'id').toUpperCase()

  const handleLangChange = (lang: 'id' | 'en') => {
    saveSettings({
      ...settings,
      lang
    })
    setOpenMenu(false)
  }

  if (props.variant === 'bullet') {
    return (
      <div className='flex items-center gap-2 bg-slate-100 p-1 rounded-full w-full mx-auto'>
        <button
          type='button'
          onClick={() => handleLangChange('id')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedLang === 'ID'
              ? 'bg-white text-primary shadow-sm font-bold scale-[1.02]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FlagsID />
          <span>ID</span>
        </button>
        <button
          type='button'
          onClick={() => handleLangChange('en')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedLang === 'EN'
              ? 'bg-white text-primary shadow-sm font-bold scale-[1.02]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FlagsEN />
          <span>EN</span>
        </button>
      </div>
    )
  }

  return (
    <div
      className={`h-full relative group flex`}
      onMouseEnter={() => setOpenMenu(true)}
      onMouseLeave={() => setOpenMenu(false)}
    >
      <div className='flex items-center'>
        <Link
          href={''}
          className={`text-xs flex items-center gap-1 py-1 px-2 rounded-full ${openMenu ? (props.dark ? 'border' : 'border border-primary') : ''} transition-colors duration-150`}
        >
          {selectedLang === 'ID' ? <FlagsID /> : <FlagsEN />}
          <motion.span
            className='ms-1'
            animate={{ rotateX: openMenu ? 180 : 0 }}
            style={{ display: 'inline-block', transformPerspective: 400 }}
            transition={{ duration: 0.35, ease: [0.45, 0, 0.55, 1] }}
          >
            <ChevronDown size={18} />
          </motion.span>
        </Link>
      </div>
      <div
        className={`absolute right-0 top-full w-auto bg-white text-gray-800 rounded-bl-xl rounded-br-xl shadow-lg border border-gray-200 z-50 ${openMenu ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      >
        <button
          className={`flex gap-2 justify-center w-full px-4 py-2 text-left hover:bg-primary hover:text-primary transition-colors duration-150 ${selectedLang === 'ID' ? 'font-bold text-primary' : ''}`}
          onClick={() => handleLangChange('id')}
        >
          <FlagsID /> ID
        </button>
        <button
          className={`flex gap-2 justify-center w-full px-4 py-2 text-left rounded-b-xl hover:bg-primary hover:text-primary transition-colors duration-150 ${selectedLang === 'EN' ? 'font-bold text-primary' : ''}`}
          onClick={() => handleLangChange('en')}
        >
          <FlagsEN /> EN
        </button>
      </div>
    </div>
  )
}

export default NavLanguage
