<script lang="ts">
    import { ChartMixedOutline, DotsVerticalOutline, HomeOutline, ListOutline } from "flowbite-svelte-icons";

  
</script>

<div class="dock dock-md">
  <button class="dock-active">
    <HomeOutline width="24px" height="24px" />
    <span class="dock-label">Home</span>
  </button>
  
  <button>
    <ChartMixedOutline width="24px" height="24px"/>
    <span class="dock-label">Progress</span>
  </button>

  <button>
    <ListOutline width="24px" height="24px"/> 
    <span class="dock-label">History</span>
  </button> 

  <button>
    <DotsVerticalOutline width="24px" height="24px" />
    <span class="dock-label">Settings</span>
  </button>
</div>

