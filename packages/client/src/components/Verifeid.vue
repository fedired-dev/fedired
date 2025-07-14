   <template>
       <div>
           <span>{{ user.name }} (@{{ user.username }})</span>
           <span v-if="user.isVerified" v-tooltip.noDelay="'Usuario Verificado'" style="color: var(--badge); margin-left: 4px;">
               <i :class="icon('ph-bold ph-seal-check')"></i>
           </span>
           <span v-if="user.isSponsor" v-tooltip.noDelay="'Patrocinador'" style="color: var(--accent); margin-left: 4px;">
               <i :class="icon('ph-bold ph-heart')"></i>
           </span>
       </div>
   </template>

   <script lang="ts" setup>
   defineProps<{
       user: entities.UserDetailed;
   }>();
   </script>
