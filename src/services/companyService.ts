import { supabase } from "@/integrations/supabase/client";

/**
 * Upload company logo to Supabase storage
 * @param file - The logo file to upload
 * @param userId - The user ID for folder organization
 * @param companyId - The company ID (optional, for organizing)
 * @returns The public URL of the uploaded logo or null if failed
 */
export const uploadCompanyLogo = async (
  file: File,
  userId: string,
  companyId?: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = companyId
      ? `${userId}/${companyId}/logo-${timestamp}.${fileExt}`
      : `${userId}/logo-${timestamp}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading company logo:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('company-logos')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading company logo:', error);
    return null;
  }
};

/**
 * Delete company logo from Supabase storage
 * @param logoPath - The storage path of the logo to delete
 * @returns True if deletion was successful, false otherwise
 */
export const deleteCompanyLogo = async (logoPath: string): Promise<boolean> => {
  try {
    // Extract the path from the public URL if needed
    const pathMatch = logoPath.match(/company-logos\/(.+)$/);
    const filePath = pathMatch ? pathMatch[1] : logoPath;

    const { error } = await supabase.storage
      .from('company-logos')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting company logo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting company logo:', error);
    return false;
  }
};

/**
 * Update company logo in the database
 * @param companyId - The company ID to update
 * @param logoPath - The new logo path/URL
 * @returns True if update was successful, false otherwise
 */
export const updateCompanyLogoPath = async (
  companyId: string,
  logoPath: string | null
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('companies')
      .update({ logo_path: logoPath })
      .eq('id', companyId);

    if (error) {
      console.error('Error updating company logo path:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating company logo path:', error);
    return false;
  }
};
