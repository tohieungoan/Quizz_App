import { useEffect, useRef, useState } from 'react'

interface UseAudioListenerProps {
  lastAudioChunk: string | null
}

export const useAudioListener = ({ lastAudioChunk }: UseAudioListenerProps) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const mediaSourceRef = useRef<MediaSource | null>(null)
  const sourceBufferRef = useRef<SourceBuffer | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const chunkQueueRef = useRef<Uint8Array[]>([])
  const playingTimerRef = useRef<any>(null)

  const processQueue = () => {
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
  }

  useEffect(() => {
    const audio = new Audio()
    audio.autoplay = true
    audioElementRef.current = audio

    const ms = new MediaSource()
    mediaSourceRef.current = ms
    audio.src = URL.createObjectURL(ms)

    ms.addEventListener('sourceopen', () => {
      try {
        const mimeType = 'audio/webm;codecs=opus'
        if (MediaSource.isTypeSupported(mimeType)) {
          const sb = ms.addSourceBuffer(mimeType)
          sourceBufferRef.current = sb
          sb.addEventListener('updateend', () => {
            processQueue()
          })
        }
      } catch (err) {
        console.error('MediaSource addSourceBuffer failed:', err)
      }
    })

    return () => {
      try {
        audio.pause()
        audio.src = ''
      } catch (e) {}
    }
  }, [])

  useEffect(() => {
    if (!lastAudioChunk) return

    try {
      const binaryString = window.atob(lastAudioChunk)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      chunkQueueRef.current.push(bytes)
      processQueue()

      if (audioElementRef.current && audioElementRef.current.paused) {
        audioElementRef.current.play().catch(() => {})
      }

      setIsPlaying(true)
      if (playingTimerRef.current) clearTimeout(playingTimerRef.current)
      playingTimerRef.current = setTimeout(() => setIsPlaying(false), 2500)
    } catch (e) {
      console.warn('Error processing audio chunk:', e)
    }
  }, [lastAudioChunk])

  return {
    isHostSpeaking: isPlaying,
  }
}
