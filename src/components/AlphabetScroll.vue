<template>
  <div class="flex relative h-full">
    <!-- Main content area -->
    <div class="flex-1 overflow-hidden">
      <ScrollArea ref="scrollAreaRef" :class="scrollAreaClass" @scroll="handleScroll">
        <div ref="contentRef">
          <div v-for="section in sectionsData" :key="section.letter" class="mb-2">

            <!-- Invisible scroll target -->
            <div :ref="el => letterRefs[section.letter] = el" class="h-0" :data-letter="section.letter"></div>

            <!-- Letter header -->
            <div class="sticky top-0" :class="letterHeaderClass">
              <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {{ section.letter === '#' ? 'Otros' : section.letter }}
              </h3>
            </div>

            <!-- Items in this section -->
            <div class="space-y-1">
              <slot name="item" v-for="item in section.items" :key="getItemKey(item)" :item="item"
                :letter="section.letter">
                <!-- Default item rendering -->
                <div class="p-3 hover:bg-muted rounded-md cursor-pointer">
                  {{ getItemLabel(item) }}
                </div>
              </slot>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!sectionsData.length" class="flex flex-col items-center justify-center py-12 text-center">
            <div class="text-muted-foreground">
              <slot name="empty">
                <p>No hay elementos para mostrar.</p>
              </slot>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>

    <!-- Alphabet navigation sidebar -->
    <div v-if="availableLetters.length > 1"
      class="flex flex-col items-center justify-center py-2 px-1 rounded-r-lg ml-2"
      :class="{ 'opacity-75': isScrolling }">
      <div ref="alphabetRef" class="flex flex-col items-center space-y-1 select-none" @touchstart="handleTouchStart"
        @touchmove="handleTouchMove" @touchend="handleTouchEnd" @mousedown="handleMouseDown">
        <button v-for="letter in availableLetters" :key="letter" ref="letterButtons"
          class="w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full transition-all duration-150 active:scale-110"
          :class="{
            'bg-primary text-primary-foreground shadow-sm': activeSection === letter,
            'hover:bg-muted hover:text-foreground': activeSection !== letter,
            'animate-pulse': touchingLetter === letter
          }" @click="scrollToLetter(letter)" @mouseenter="handleLetterHover(letter)">
          {{ letter === '#' ? '#' : letter }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  labelKey: {
    type: String,
    default: 'name'
  },
  idKey: {
    type: String,
    default: 'id'
  },
  scrollAreaClass: {
    type: String,
    default: 'h-96'
  },
  letterHeaderClass: {
    type: String,
    default: 'bg-background/95 backdrop-blur-sm py-2 px-3 border-b'
  },
  enableHaptic: {
    type: Boolean,
    default: true
  }
})

// Refs
const scrollAreaRef = ref(null)
const contentRef = ref(null)
const alphabetRef = ref(null)
const letterRefs = ref({})
const letterButtons = ref([])

// State
const activeSection = ref('')
const isScrolling = ref(false)
const touchingLetter = ref('')
const isDragging = ref(false)
let scrollTimeout = null

// Computed properties
const sectionsData = computed(() => {
  if (!props.items.length) return []

  const sections = {}

  props.items.forEach(item => {
    const label = getItemLabel(item)
    const firstChar = label.charAt(0).toUpperCase()

    // Handle special characters and numbers
    const letter = /^[A-ZÀ-ÿ]/.test(firstChar) ? firstChar : '#'

    if (!sections[letter]) {
      sections[letter] = []
    }
    sections[letter].push(item)
  })

  // Sort sections alphabetically, with '#' at the end
  const sortedKeys = Object.keys(sections).sort((a, b) => {
    if (a === '#') return 1
    if (b === '#') return -1
    return a.localeCompare(b)
  })

  return sortedKeys.map(letter => ({
    letter,
    items: sections[letter].sort((a, b) =>
      getItemLabel(a).localeCompare(getItemLabel(b))
    )
  }))
})

const availableLetters = computed(() =>
  sectionsData.value.map(section => section.letter)
)

// Methods
const getItemLabel = (item) => {
  return typeof item === 'string' ? item : item[props.labelKey] || ''
}

const getItemKey = (item) => {
  return typeof item === 'string' ? item : item[props.idKey] || item
}

const scrollToLetter = async (letter) => {
  const element = letterRefs.value[letter]
  if (!element) return

  // Haptic feedback
  if (props.enableHaptic && 'vibrate' in navigator) {
    navigator.vibrate(10)
  }

  // Scroll to the element
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })

  // Update active section
  activeSection.value = letter
  touchingLetter.value = letter

  // Clear touching state after animation
  setTimeout(() => {
    touchingLetter.value = ''
  }, 200)
}

const handleScroll = () => {
  if (isDragging.value) return

  isScrolling.value = true

  // Clear existing timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
}

// Touch/Mouse handlers for alphabet navigation
const handleTouchStart = (e) => {
  e.preventDefault()
  isDragging.value = true
  handleTouchMove(e)
}

const handleTouchMove = (e) => {
  e.preventDefault()
  if (!isDragging.value) return

  const touch = e.touches[0]
  const element = document.elementFromPoint(touch.clientX, touch.clientY)

  if (element && letterButtons.value.includes(element)) {
    const letter = element.textContent.trim()
    if (availableLetters.value.includes(letter) && touchingLetter.value !== letter) {
      scrollToLetter(letter)
    }
  }
}

const handleTouchEnd = () => {
  isDragging.value = false
}

const handleMouseDown = () => {
  isDragging.value = true

  const handleMouseMove = (e) => {
    const element = document.elementFromPoint(e.clientX, e.clientY)
    if (element && letterButtons.value.includes(element)) {
      const letter = element.textContent.trim()
      if (availableLetters.value.includes(letter) && touchingLetter.value !== letter) {
        scrollToLetter(letter)
      }
    }
  }

  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleLetterHover = (letter) => {
  if (!isDragging.value) return
  scrollToLetter(letter)
}

// Watch for items changes
watch(() => props.items, async () => {
  await nextTick()
  if (availableLetters.value.length > 0 && !activeSection.value) {
    activeSection.value = availableLetters.value[0]
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  await nextTick()

  // Set initial active section
  if (availableLetters.value.length > 0) {
    activeSection.value = availableLetters.value[0]
  }
})

onUnmounted(() => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})
</script>
