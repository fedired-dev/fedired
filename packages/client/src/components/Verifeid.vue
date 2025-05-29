   <template>
       <div>
           <span>{{ user.name }} (@{{ user.username }})</span>
           <span v-if="isAdmin" v-tooltip.noDelay="'Verificado'" style="color: var(--badge); margin-left: 4px;">
               <i :class="icon('ph-bold ph-seal-check')"></i>
           </span>
           <span v-if="isModerator" v-tooltip.noDelay="'Verificado'" style="color: var(--badge); margin-left: 4px;">
               <i :class="icon('ph-bold ph-seal-check')"></i>
           </span>
       </div>
   </template>

   <script lang="ts" setup>
   defineProps<{
       user: entities.UserDetailed;
   }>();

   const isAdmin = computed(() => user.isAdmin && user.username === 'srnovus');
   const isModerator = computed(() => user.isModerator && user.username === 'fedired');
   </script>
