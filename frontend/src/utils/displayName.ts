export const DISPLAY_NAME_MAX_LENGTH = 10
export const DISPLAY_NAME_HELPER_TEXT = '該名稱將顯示於評價上，請謹慎使用名稱'

export const validateDisplayName = (name: string): string | null => {
	const trimmed = name.trim()
	if (!trimmed) {
		return '名稱不可為空'
	}
	if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
		return `名稱不可超過 ${DISPLAY_NAME_MAX_LENGTH} 字`
	}
	return null
}
