# frozen_string_literal: true

class Admin::Settings::fediredController < Admin::SettingsController
  private

  def after_update_redirect_path
    admin_settings_fedired_path
  end
end
