<template>
  <MkStickyContainer>
    <template #header>
      <MkPageHeader :actions="headerActions" :tabs="headerTabs"/>
    </template>
    <div style="overflow: clip">
      <MkSpacer :content-max="600" :margin-min="20">
        <div class="_formRoot znqjceqz">
          <div id="debug"></div>
          <div
            ref="containerEl"
            v-panel
            class="_formBlock about"
            :class="{ playing: easterEggEngine != null }"
          >
            <img
              src="/client-assets/about-icon.png"
              alt=""
              class="icon"
              draggable="false"
              @load="iconLoaded"
              @click="gravity"
            />
            <div class="misskey">Fedired</div>
            <div class="version">v{{ version }}</div>
            <span
              v-for="emoji in easterEggEmojis"
              :key="emoji.id"
              class="emoji"
              :data-physics-x="emoji.left"
              :data-physics-y="emoji.top"
              :class="{
                _physics_circle_: !emoji.emoji.startsWith(':'),
              }"
            >
              <MkEmoji
                class="emoji"
                :emoji="emoji.emoji"
                :custom-emojis="instanceEmojis"
                :is-reaction="false"
                :normal="true"
                :no-style="true"
              />
            </span>
          </div>
          <div class="_formBlock" style="text-align: center">
            {{ i18n.ts._aboutFedired.about }}<br />
            <a
              href="https://help.fedired.com/project/fedired.html"
              target="_blank"
              class="_link"
            >
              {{ i18n.ts.learnMore }}
            </a>
          </div>
          <div class="_formBlock" style="text-align: center">
            <MkButton primary rounded inline @click="iLoveMisskey">
              I <Mfm text="$[jelly ❤]" /> #Fedired
            </MkButton>
          </div>
          <FormSection>
            <div class="_formLinks">
              <FormLink to="https://github.com/fedired-dev/fedired/" external>
                <template #icon>
                  <i :class="icon('ph-code')"></i>
                </template>
                {{ i18n.ts._aboutFedired.source }}
                <template #suffix>Source</template>
              </FormLink>
              <FormLink to="https://patreon.com/fedired/" external>
                <template #icon>
                  <i :class="icon('ph-heart')"></i>
                </template>
                Donar
                <template #suffix>Donation</template>
              </FormLink>
              <FormLink to="https://help.fedired.com/legal/licencias.html" external>
                <template #icon>
                  <i :class="icon('ph-gavel')"></i>
                </template>
                Legal
                <template #suffix>Licencias</template>
              </FormLink>
            </div>
          </FormSection>
          <FormSection>
            <template #label>Contribuyentes</template>
            <div class="contributors">
              <div
                class="contributor"
                v-for="contributor in contributors"
                :key="contributor.username"
              >
                <a :href="contributor.link" target="_blank" class="_contributor">
                  <img :src="contributor.avatar" class="contributorAvatar" />
                  <span class="contributorUsername">{{ contributor.username }}</span>
                </a>
              </div>
            </div>
          </FormSection>

          <FormSection>
            <template #label>Donadores</template>
            <div class="_formBlock" style="text-align: ">
              <p>
                Agradecemos a nuestros donadores que han apoyado el proyecto a través de Patreon y otras plataformas.
              </p>
              <ul>
                <li><strong>@ibootech</strong> - Donación única</li>
                <li><strong>@j-rec</strong> - Donación única</li>
              </ul>
            </div>
          </FormSection>

          <FormSection>
            <template #label>Agradecimientos</template>
            <div class="_formBlock" style="text-align: ">
              <p>
                Agradecemos a todos los colaboradores, desde los desarrolladores hasta los usuarios que contribuyen activamente. Sin su apoyo, Fedired no sería posible.
              </p>
              <ul>
                <li><strong>@ale@mastodon.manalejandro.com</strong></li>
                <li><strong>Edgar Argueta</strong></li>
                <li><strong>Joshua</strong></li>
              </ul>
            </div>
          </FormSection>

        </div>
      </MkSpacer>
    </div>
  </MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { version } from "@/config";
import FormLink from "@/components/form/link.vue";
import FormSection from "@/components/form/section.vue";
import MkButton from "@/components/MkButton.vue";
import { physics } from "@/scripts/physics";
import { i18n } from "@/i18n";
import { defaultReactions, defaultStore } from "@/store";
import * as os from "@/os";
import { definePageMetadata } from "@/scripts/page-metadata";
import icon from "@/scripts/icon";
import { getInstanceInfo } from "@/instance";

let easterEggReady = false;
const easterEggEmojis = ref([]);
const easterEggEngine = ref(null);
const containerEl = ref<HTMLElement>();
const instanceEmojis = getInstanceInfo().emojis;

function iconLoaded() {
  const emojis =
    defaultStore.state.reactions.length > 0
      ? defaultStore.state.reactions
      : defaultReactions;
  const containerWidth = containerEl.value?.offsetWidth;
  for (let i = 0; i < 32; i++) {
    easterEggEmojis.value.push({
      id: i.toString(),
      top: -(128 + Math.random() * 256),
      left: Math.random() * containerWidth,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    });
  }
  nextTick(() => {
    easterEggReady = true;
  });
}

function gravity() {
  if (!easterEggReady) return;
  easterEggReady = false;
  easterEggEngine.value = physics(containerEl.value);
}

function iLoveMisskey() {
  os.post({
    initialText: "I $[jelly ❤] #Fedired",
    instant: true,
  });
}

onBeforeUnmount(() => {
  if (easterEggEngine.value) {
    easterEggEngine.value.stop();
  }
});

const headerActions = computed(() => []);
const headerTabs = computed(() => []);
definePageMetadata({
  title: i18n.ts.aboutFedired,
  icon: null,
});

const contributors = [
  {
    username: '@srnovus',
    link: 'https://fedired.com/@srnovus',
    avatar: 'https://avatars.githubusercontent.com/u/81489497?v=4',
  },
  {
    username: '@syuilo',
    link: 'https://github.com/syuilo',
    avatar: 'https://avatars.githubusercontent.com/u/4439005?v=4', 
  },  
	{
    username: '@naskya',
    link: 'https://codeberg.org/naskya',
    avatar: 'https://codeberg.org/avatars/0f6ca7a56df9812bc539e499ccac9030fd4cb19a2dc4d57402e1d96f78fa2110?size=512', 
  }, 
	{
    username: '@jazmin',
    link: 'https://www.instagram.com/jazmin_mc73/',
    avatar: 'https://instagram.faqb1-1.fna.fbcdn.net/v/t51.2885-19/379687695_255672004108612_7243932620264131712_n.jpg?stp=dst-jpg_s640x640_tt6&_nc_ht=instagram.faqb1-1.fna.fbcdn.net&_nc_cat=104&_nc_oc=Q6cZ2QHUZPEHX3G_w5vedvC_nMNEUBqdtJ8cNfH8ojtmSkETuL7jFyQwLEJOH5kTnyLdVyA0Dp3OO_WdNSrnliolJnrv&_nc_ohc=D9bWQ3ESzLoQ7kNvwFgsQyX&_nc_gid=RvcBxnpXqnu339ztR4WV6Q&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfLRekbz9lWtXEBwHca930kdDPOZ_fbuyfTULvAr18MRTw&oe=683E64AA&_nc_sid=10d13b', 
  }
];
</script>

<style lang="scss" scoped>
.znqjceqz {
  > .about {
    position: relative;
    text-align: center;
    padding: 16px;
    border-radius: var(--radius);

    > .icon {
      display: block;
      width: 80px;
      margin: 0 auto;
      border-radius: 16px;
      position: relative;
      z-index: 1;
    }

    > .misskey {
      margin: 0.75em auto 0 auto;
      width: max-content;
      position: relative;
      z-index: 1;
      font-weight: bold;
      font-size: 1.2em;
    }

    > .version {
      margin: 0 auto;
      width: max-content;
      opacity: 0.7;
      position: relative;
      z-index: 1;
      font-style: italic;
    }

    > .emoji {
      position: absolute;
      z-index: 1;
      top: 0;
      left: 0;
      visibility: hidden;

      > .emoji {
        pointer-events: none;
        font-size: 24px;
        width: 24px;
      }
    }

    &.playing {
      &, * {
        user-select: none;
      }

      * {
        will-change: transform;
      }

      > .emoji {
        visibility: visible;
      }
    }
  }
}

._formLinks {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 16px;

  a {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: inherit;
    background: var(--MI_THEME-buttonBg);
    border-radius: 8px;
    padding: 12px;
  }
}

.contributors {
  display: flex;
  flex-direction: row;
  align-items: center;
	flex-wrap: wrap;
	align-content: space-around;
	justify-content: space-around;

  .contributor {
    margin-bottom: 10px;
    text-align: center;

    .contributorAvatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
    }

    .contributorUsername {
      display: block;
      margin-top: 8px;
      font-weight: bold;
      font-size: 1em;
    }
  }
}

</style>