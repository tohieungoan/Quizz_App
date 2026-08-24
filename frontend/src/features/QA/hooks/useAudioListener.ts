import { useEffect, useRef, useState, useCallback } from 'react'

interface UseAudioListenerProps {
  lastAudioChunk: string | null
}

export const useAudioListener = ({ lastAudioChunk }: UseAudioListenerProps) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false)
  const [needUserGesture, setNeedUserGesture] = useState<boolean>(false)

  const mediaSourceRef = useRef<MediaSource | null>(null)
  const sourceBufferRef = useRef<SourceBuffer | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const chunkQueueRef = useRef<Uint8Array[]>([])
  const playingTimerRef = useRef<any>(null)

  // Try to unlock AudioContext / HTMLAudioElement upon user interaction
  const unlockAudio = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {})
    }
    if (audioElementRef.current) {
      audioElementRef.current
        .play()
        .then(() => {
          setNeedUserGesture(false)
        })
        .catch(() => {
          setNeedUserGesture(true)
        })
    }
  }, [])

  useEffect(() => {
    const handleGesture = () => {
      unlockAudio()
    }
    window.addEventListener('click', handleGesture)
    window.addEventListener('touchstart', handleGesture)
    window.addEventListener('keydown', handleGesture)

    return () => {
      window.removeEventListener('click', handleGesture)
      window.removeEventListener('touchstart', handleGesture)
      window.removeEventListener('keydown', handleGesture)
    }
  }, [unlockAudio])

  const processQueue = useCallback(() => {
    if (
      !sourceBufferRef.current ||
      sourceBufferRef.current.updating ||
      chunkQueueRef.current.length === 0
    ) {
      return
    }

    try {
      const chunk = chunkQueueRef.current.shift()!
      sourceBufferRef.current.appendBuffer(chunk.buffer as ArrayBuffer)
    } catch (e) {
      console.warn('SourceBuffer append error:', e)
    }
  }, [])

  useEffect(() => {
    const audio = new Audio()
    audio.autoplay = true
    audioElementRef.current = audio

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      try {
        audioCtxRef.current = new AudioContextClass()
      } catch (e) {}
    }

    const ms = new MediaSource()
    mediaSourceRef.current = ms
    audio.src = URL.createObjectURL(ms)

    ms.addEventListener('sourceopen', () => {
      try {
        const mimeCandidates = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          'audio/mp4',
        ]
        let chosenMime = ''
        for (const candidate of mimeCandidates) {
          if (MediaSource.isTypeSupported(candidate)) {
            chosenMime = candidate
            break
          }
        }

        if (chosenMime) {
          const sb = ms.addSourceBuffer(chosenMime)
          sourceBufferRef.current = sb
          sb.addEventListener('updateend', () => {
            processQueue()
          })
        } else {
          console.warn('No supported MediaSource MIME type found for live audio streaming.')
        }
      } catch (err) {
        console.error('MediaSource addSourceBuffer failed:', err)
      }
    })

    return () => {
      try {
        audio.pause()
        audio.src = ''
        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => {})
        }
      } catch (e) {}
    }
  }, [processQueue])

  useEffect(() => {
    if (!lastAudioChunk || isAudioMuted) return

    try {
      const binaryString = window.atob(lastAudioChunk)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      chunkQueueRef.current.push(bytes)
      processQueue()

      if (audioElementRef.current) {
        if (audioElementRef.current.paused) {
          audioElementRef.current
            .play()
            .then(() => {
              setNeedUserGesture(false)
            })
            .catch(() => {
              setNeedUserGesture(true)
            })
        }
      }

      setIsPlaying(true)
      if (playingTimerRef.current) clearTimeout(playingTimerRef.current)
      playingTimerRef.current = setTimeout(() => setIsPlaying(false), 2500)
    } catch (e) {
      console.warn('Error processing audio chunk:', e)
    }
  }, [lastAudioChunk, isAudioMuted, processQueue])

  return {
    isHostSpeaking: isPlaying,
    needUserGesture,
    isAudioMuted,
    toggleMuteAudio: () => setIsAudioMuted((prev) => !prev),
    unlockAudio,
  }
}
