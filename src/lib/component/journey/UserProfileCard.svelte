<script lang="ts">
	import { Avatar } from '@thwbh/veilchen';
	import { getAvatar } from '$lib/avatar';
	import { getActivityLevelInfo } from '$lib/activity';

	interface Props {
		userName: string;
		userAvatar: string;
		activityLevel: number;
	}

	let { userName, userAvatar, activityLevel }: Props = $props();

	let avatarSrc = $derived(getAvatar(userAvatar || userName));
	let activityInfo = $derived(getActivityLevelInfo(activityLevel));
	let ActivityIcon = $derived(activityInfo.icon);
</script>

<div class="bg-base-100 rounded-box p-6 shadow">
	<div class="flex items-center gap-6">
		<div class="flex-1 space-y-3">
			<div>
				<p class="text-sm text-base-content opacity-60">Nickname</p>
				<p class="text-xl font-bold text-base-content">{userName}</p>
			</div>
			<div class="flex items-center gap-3">
				<div>
					<p class="text-sm text-base-content opacity-60">Activity Level</p>
					<span class="flex flex-row gap-2">
						<ActivityIcon size="1.5em" />
						<p class="font-semibold text-base-content">{activityInfo.label}</p>
					</span>
				</div>
			</div>
		</div>
		<Avatar size="2xl" src={avatarSrc} />
	</div>
</div>
