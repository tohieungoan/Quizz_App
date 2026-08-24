import { useEffect, useRef, useState, useCallback } from 'react'

/** Live audio listener with Web Audio API, MediaSource fallback & user gesture unlock */
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
  const headerChunkRef = useRef<Uint8Array | null>(null)
  const chunkQueueRef = useRef<Uint8Array[]>([])
  const playingTimerRef = useRef<any>(null)

  // Try to unlock AudioContext / HTMLAudioElement upon user interaction
  const unlockAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current
        .play()
        .then(() => {
          setNeedUserGesture(false)
          console.log('[AudioListener] Audio element playback unlocked successfully!')
        })
        .catch((err) => {
          console.warn('[AudioListener] Audio unlock failed:', err)
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
      console.log(`[AudioListener] Appended ${chunk.length} bytes to SourceBuffer. Queue length=${chunkQueueRef.current.length}`)
    } catch (e) {
      console.warn('[AudioListener] SourceBuffer append error:', e)
    }
  }, [])

  useEffect(() => {
    const audio = new Audio()
    audio.autoplay = true
    audioElementRef.current = audio

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
          console.log(`[AudioListener] Selected MediaSource MIME type: ${chosenMime}`)
          const sb = ms.addSourceBuffer(chosenMime)
          sourceBufferRef.current = sb
          sb.addEventListener('updateend', () => {
            processQueue()
          })
        } else {
          console.warn('[AudioListener] No supported MediaSource MIME type found.')
        }
      } catch (err) {
        console.error('[AudioListener] MediaSource addSourceBuffer failed:', err)
      }
    })

    return () => {
      try {
        audio.pause()
        audio.src = ''
      } catch (e) {}
    }
  }, [processQueue])

  useEffect(() => {
    if (!lastAudioChunk || isAudioMuted) return

    try {
      console.log(`[AudioListener] Received audio chunk base64Len=${lastAudioChunk.length}`)
      const binaryString = window.atob(lastAudioChunk)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Save header chunk (first chunk) for WebM initialization
      if (!headerChunkRef.current) {
        headerChunkRef.current = bytes
      }

      // 1. Try Primary MediaSource Queue
      if (sourceBufferRef.current) {
        chunkQueueRef.current.push(bytes)
        processQueue()
      } else {
        // 2. Direct Blob Audio Fallback
        const blob = new Blob([bytes], { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const fallbackAudio = new Audio(url)
        fallbackAudio.play().catch((err) => {
          console.warn('[AudioListener] Direct Blob fallback play blocked:', err)
          setNeedUserGesture(true)
        })
      }

      if (audioElementRef.current && audioElementRef.current.paused) {
        audioElementRef.current
          .play()
          .then(() => {
            setNeedUserGesture(false)
          })
          .catch((err) => {
            console.warn('[AudioListener] Autoplay blocked by browser policy:', err)
            setNeedUserGesture(true)
          })
      }

      setIsPlaying(true)
      if (playingTimerRef.current) clearTimeout(playingTimerRef.current)
      playingTimerRef.current = setTimeout(() => setIsPlaying(false), 2500)
    } catch (e) {
      console.warn('[AudioListener] Error processing audio chunk:', e)
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
